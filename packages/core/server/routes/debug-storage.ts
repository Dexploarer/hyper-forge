/**
 * Debug Storage Route
 * Temporary endpoint to verify Railway volume configuration
 */

import { Elysia } from "elysia";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "..", "..");

export const debugStorageRoute = new Elysia({ prefix: "/api/debug" }).get(
  "/storage-info",
  async () => {
    const mediaRoot = path.join(ROOT_DIR, "gdd-assets", "media");

    // Check if directory exists
    const dirExists = await fs.promises
      .access(mediaRoot)
      .then(() => true)
      .catch(() => false);

    let dirInfo = null;
    let fileCount = 0;
    let totalSize = 0;

    if (dirExists) {
      try {
        // Get directory stats
        const stats = await fs.promises.stat(mediaRoot);

        // Count files recursively
        const countFiles = async (dir: string): Promise<number> => {
          let count = 0;
          const items = await fs.promises.readdir(dir, { withFileTypes: true });

          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
              count += await countFiles(fullPath);
            } else {
              count++;
              const fileStat = await fs.promises.stat(fullPath);
              totalSize += fileStat.size;
            }
          }

          return count;
        };

        fileCount = await countFiles(mediaRoot);

        dirInfo = {
          exists: true,
          path: mediaRoot,
          created: stats.birthtime,
          modified: stats.mtime,
          writable: await fs.promises
            .access(mediaRoot, fs.constants.W_OK)
            .then(() => true)
            .catch(() => false),
        };
      } catch (error) {
        dirInfo = {
          exists: true,
          path: mediaRoot,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === "production",
        isRailway: !!process.env.RAILWAY_ENVIRONMENT,
        railwayEnvironment: process.env.RAILWAY_ENVIRONMENT || null,
      },
      volume: {
        configured: !!process.env.RAILWAY_VOLUME_MOUNT_PATH,
        mountPath: process.env.RAILWAY_VOLUME_MOUNT_PATH || null,
        customVolumeVars: Object.keys(process.env)
          .filter((key) => key.toLowerCase().includes("volume"))
          .reduce((acc, key) => ({ ...acc, [key]: process.env[key] }), {}),
      },
      storage: {
        rootDir: ROOT_DIR,
        mediaRoot,
        directory: dirInfo,
        fileCount,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      },
      test: {
        canWriteTest: await (async () => {
          try {
            const testFile = path.join(mediaRoot, ".write-test");
            await fs.promises.mkdir(mediaRoot, { recursive: true });
            await fs.promises.writeFile(testFile, "test");
            await fs.promises.unlink(testFile);
            return true;
          } catch (error) {
            return error instanceof Error ? error.message : false;
          }
        })(),
      },
    };
  },
);
