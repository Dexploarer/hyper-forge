import { Elysia } from "elysia";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { mediaAssets } from "../db/schema/media.schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

const CDN_URL = env.CDN_URL || "http://localhost:3005";
const CDN_API_KEY = env.CDN_API_KEY;
const ASSETS_DIR = env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(env.RAILWAY_VOLUME_MOUNT_PATH, "gdd-assets")
  : env.ASSETS_DIR || path.join(process.cwd(), "gdd-assets");

async function uploadFileToCDN(
  filePath: string,
  cdnPath: string,
): Promise<string | null> {
  try {
    const file = await fs.readFile(filePath);
    const formData = new FormData();

    const fileName = path.basename(cdnPath);
    const blob = new Blob([file], {
      type: fileName.endsWith(".mp3")
        ? "audio/mpeg"
        : fileName.endsWith(".wav")
          ? "audio/wav"
          : fileName.endsWith(".ogg")
            ? "audio/ogg"
            : fileName.endsWith(".png")
              ? "image/png"
              : "application/octet-stream",
    });

    formData.append("files", blob, fileName);
    formData.append("path", path.dirname(cdnPath));

    const response = await fetch(`${CDN_URL}/api/upload`, {
      method: "POST",
      headers: {
        "x-api-key": CDN_API_KEY!,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error({}, `CDN upload failed (${response.status}): ${error}`);
      return null;
    }

    const result = await response.json();
    const uploadedFile = result.files?.[0];
    if (!uploadedFile) {
      logger.error({}, "No file in upload response");
      return null;
    }

    return uploadedFile.cdnUrl;
  } catch (error) {
    logger.error({ err: error }, "Error uploading to CDN");
    return null;
  }
}

export const migrateMediaRoute = new Elysia({ prefix: "/api/admin" })
  .get("/check-volume", async () => {
    try {
      // Check what's in ASSETS_DIR
      const volumePath = env.RAILWAY_VOLUME_MOUNT_PATH || "/data";
      const assetsPath = ASSETS_DIR;

      async function listDir(dirPath: string): Promise<any> {
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          const result: any = {};
          for (const entry of entries) {
            if (entry.isDirectory()) {
              result[entry.name] = await listDir(
                path.join(dirPath, entry.name),
              );
            } else {
              result[entry.name] = "file";
            }
          }
          return result;
        } catch (err) {
          return { error: err instanceof Error ? err.message : String(err) };
        }
      }

      const volumeContents = await listDir(volumePath);
      const assetsContents = await listDir(assetsPath);

      return {
        env: {
          RAILWAY_VOLUME_MOUNT_PATH: env.RAILWAY_VOLUME_MOUNT_PATH,
          ASSETS_DIR: env.ASSETS_DIR,
        },
        computed: {
          volumePath,
          assetsPath: ASSETS_DIR,
        },
        contents: {
          volumePath: volumeContents,
          assetsPath: assetsContents,
        },
      };
    } catch (error) {
      return {
        error: "Check failed",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  })
  .post(
    "/migrate-media-to-cdn",
    async ({ set }) => {
      // Security check
      const adminToken = process.env.ADMIN_UPLOAD_TOKEN;
      if (
        !adminToken ||
        adminToken === "CHANGEME_GENERATE_WITH_OPENSSL_RAND_HEX_32"
      ) {
        set.status = 503;
        return { error: "Admin endpoint not configured" };
      }

      if (!CDN_API_KEY) {
        set.status = 400;
        return { error: "CDN_API_KEY not configured" };
      }

      try {
        const connectionString = env.DATABASE_URL;
        if (!connectionString) {
          set.status = 500;
          return { error: "DATABASE_URL not set" };
        }

        const sql = postgres(connectionString);
        const db = drizzle(sql);

        // Fetch all media assets without cdnUrl
        const assetsToMigrate = await sql`
        SELECT id, type, file_url
        FROM media_assets
        WHERE cdn_url IS NULL
        AND file_url LIKE '/gdd-assets%'
        ORDER BY type, created_at;
      `;

        logger.info(
          {},
          `Found ${assetsToMigrate.length} media assets to migrate`,
        );

        if (assetsToMigrate.length === 0) {
          await sql.end();
          return {
            success: true,
            message: "No migration needed",
            stats: { succeeded: 0, skipped: 0, failed: 0, total: 0 },
          };
        }

        let succeeded = 0;
        let failed = 0;
        let skipped = 0;
        const results = [];

        for (const asset of assetsToMigrate) {
          const fileUrl = asset.file_url || asset.fileUrl;
          const relativePath = fileUrl.replace("/gdd-assets/", "");
          const localPath = path.join(ASSETS_DIR, relativePath);

          logger.info(
            {},
            `Processing ${asset.type}: ${asset.id.substring(0, 8)}...`,
          );

          // Check if file exists
          try {
            await fs.access(localPath);
          } catch {
            logger.warn({}, `Local file not found: ${relativePath}`);
            skipped++;
            results.push({
              id: asset.id,
              type: asset.type,
              status: "skipped",
              reason: "file_not_found",
            });
            continue;
          }

          // Upload to CDN
          const cdnUrl = await uploadFileToCDN(localPath, relativePath);

          if (!cdnUrl) {
            failed++;
            results.push({
              id: asset.id,
              type: asset.type,
              status: "failed",
              reason: "upload_failed",
            });
            continue;
          }

          // Update database
          try {
            await db
              .update(mediaAssets)
              .set({ cdnUrl })
              .where(eq(mediaAssets.id, asset.id));

            logger.info({}, `Successfully migrated ${asset.id} to ${cdnUrl}`);
            succeeded++;
            results.push({
              id: asset.id,
              type: asset.type,
              status: "success",
              cdnUrl,
            });
          } catch (error) {
            logger.error(
              { err: error },
              `Database update failed for ${asset.id}`,
            );
            failed++;
            results.push({
              id: asset.id,
              type: asset.type,
              status: "failed",
              reason: "database_update_failed",
            });
          }

          // Small delay to avoid overwhelming CDN
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        await sql.end();

        logger.info(
          {},
          `Migration complete: ${succeeded} succeeded, ${skipped} skipped, ${failed} failed`,
        );

        return {
          success: true,
          message: "Migration completed",
          stats: {
            succeeded,
            skipped,
            failed,
            total: assetsToMigrate.length,
          },
          results,
        };
      } catch (error) {
        logger.error({ err: error }, "Migration error");
        set.status = 500;
        return {
          error: "Migration failed",
          details: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      detail: {
        tags: ["Admin"],
        summary: "Migrate media files from volume to CDN",
        description:
          "One-time migration endpoint to upload all media files to CDN and update database records",
      },
    },
  );
