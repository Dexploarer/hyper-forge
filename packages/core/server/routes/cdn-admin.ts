/**
 * CDN Admin Proxy Routes
 * Admin-only routes that proxy requests to the CDN service API
 *
 * These routes allow the main admin dashboard to interact with the CDN
 * without exposing CDN API keys to the client. All routes require admin
 * authentication via JWT.
 */

import { Elysia, t } from "elysia";
import { logger } from "../utils/logger";
import { requireAdminGuard } from "../plugins/auth.plugin";
import { env } from "../config/env";
import {
  ServiceUnavailableError,
  InternalServerError,
  BadRequestError,
} from "../errors";
import type { AuthUser } from "../types/auth";

/**
 * Proxy a request to the CDN API
 * Adds CDN_API_KEY header for authentication
 */
async function proxyCDNRequest({
  method,
  endpoint,
  body,
  contentType,
}: {
  method: "GET" | "POST" | "DELETE";
  endpoint: string;
  body?: any;
  contentType?: string;
}): Promise<Response> {
  const cdnUrl = env.CDN_URL;
  const cdnApiKey = env.CDN_API_KEY;

  if (!cdnUrl) {
    throw new ServiceUnavailableError(
      "CDN",
      "CDN_URL not configured in environment",
    );
  }

  if (!cdnApiKey) {
    throw new ServiceUnavailableError(
      "CDN",
      "CDN_API_KEY not configured in environment",
    );
  }

  try {
    const url = `${cdnUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "X-API-Key": cdnApiKey,
    };

    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      if (contentType === "application/json") {
        options.body = JSON.stringify(body);
      } else {
        options.body = body;
      }
    }

    logger.debug(
      { context: "CDN Admin Proxy", method, endpoint },
      "Proxying request to CDN",
    );

    const response = await fetch(url, options);

    // Return raw response (let client handle parsing)
    return response;
  } catch (error) {
    logger.error(
      { context: "CDN Admin Proxy", err: error, endpoint },
      "CDN proxy request failed",
    );
    throw new InternalServerError(
      error instanceof Error ? error.message : "CDN request failed",
    );
  }
}

export const cdnAdminRoutes = new Elysia({ prefix: "/api/admin/cdn" })
  .use(requireAdminGuard)

  /**
   * List all files on CDN
   * GET /api/admin/cdn/files
   * Proxies to: GET /api/files on CDN
   */
  .get(
    "/files",
    async ({ user, query }) => {
      const authUser = user as AuthUser;
      logger.info(
        { context: "CDN Admin", userId: authUser.id },
        "Admin listing CDN files",
      );

      // Build query string if params provided
      const queryParams = new URLSearchParams();
      if (query.path) queryParams.set("path", query.path);
      if (query.limit) queryParams.set("limit", query.limit);

      const endpoint = `/api/files${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await proxyCDNRequest({ method: "GET", endpoint });

      return response;
    },
    {
      query: t.Object({
        path: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Admin", "CDN"],
        summary: "List all files on CDN (Admin only)",
        description:
          "Retrieve a list of all files stored on the CDN. Supports optional filtering by path and limit.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * Get directory statistics
   * GET /api/admin/cdn/directories
   * Proxies to: GET /api/directories on CDN
   */
  .get(
    "/directories",
    async ({ user }) => {
      const authUser = user as AuthUser;
      logger.info(
        { context: "CDN Admin", userId: authUser.id },
        "Admin getting CDN directory stats",
      );

      const response = await proxyCDNRequest({
        method: "GET",
        endpoint: "/api/directories",
      });

      return response;
    },
    {
      detail: {
        tags: ["Admin", "CDN"],
        summary: "Get directory statistics (Admin only)",
        description:
          "Retrieve statistics about directories on the CDN, including file counts and sizes.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * Upload files to CDN
   * POST /api/admin/cdn/upload
   * Proxies to: POST /api/upload on CDN
   *
   * Note: This endpoint accepts multipart/form-data with files
   */
  .post(
    "/upload",
    async ({ user, request }) => {
      const authUser = user as AuthUser;
      logger.info(
        { context: "CDN Admin", userId: authUser.id },
        "Admin uploading files to CDN",
      );

      // Get raw request body for multipart/form-data
      const formData = await request.formData();

      const response = await proxyCDNRequest({
        method: "POST",
        endpoint: "/api/upload",
        body: formData,
        // Don't set Content-Type - let fetch set it with boundary
      });

      return response;
    },
    {
      detail: {
        tags: ["Admin", "CDN"],
        summary: "Upload files to CDN (Admin only)",
        description:
          "Upload one or more files to the CDN. Accepts multipart/form-data with file fields.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * Delete a file from CDN
   * DELETE /api/admin/cdn/delete/:path
   * Proxies to: DELETE /api/delete/:path on CDN
   */
  .delete(
    "/delete/:path",
    async ({ user, params }) => {
      const authUser = user as AuthUser;
      const { path } = params;

      logger.info(
        { context: "CDN Admin", userId: authUser.id, path },
        "Admin deleting file from CDN",
      );

      const response = await proxyCDNRequest({
        method: "DELETE",
        endpoint: `/api/delete/${encodeURIComponent(path)}`,
      });

      return response;
    },
    {
      params: t.Object({
        path: t.String(),
      }),
      detail: {
        tags: ["Admin", "CDN"],
        summary: "Delete file from CDN (Admin only)",
        description:
          "Delete a specific file from the CDN by its path. Use with caution - this operation cannot be undone.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * Rename a file on CDN
   * POST /api/admin/cdn/rename
   * Proxies to: POST /api/rename on CDN
   */
  .post(
    "/rename",
    async ({ user, body }) => {
      const authUser = user as AuthUser;
      logger.info(
        { context: "CDN Admin", userId: authUser.id, body },
        "Admin renaming file on CDN",
      );

      const response = await proxyCDNRequest({
        method: "POST",
        endpoint: "/api/rename",
        body,
        contentType: "application/json",
      });

      return response;
    },
    {
      body: t.Object({
        oldPath: t.String(),
        newPath: t.String(),
      }),
      detail: {
        tags: ["Admin", "CDN"],
        summary: "Rename file on CDN (Admin only)",
        description:
          "Rename a file on the CDN from oldPath to newPath. Both paths should be relative to CDN root.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * Bulk download files as ZIP
   * POST /api/admin/cdn/bulk-download
   * Proxies to: POST /api/bulk-download on CDN
   */
  .post(
    "/bulk-download",
    async ({ user, body }) => {
      const authUser = user as AuthUser;
      const requestBody = body as { paths: string[] };

      logger.info(
        {
          context: "CDN Admin",
          userId: authUser.id,
          fileCount: requestBody.paths.length,
        },
        "Admin bulk downloading files from CDN",
      );

      const response = await proxyCDNRequest({
        method: "POST",
        endpoint: "/api/bulk-download",
        body: requestBody,
        contentType: "application/json",
      });

      return response;
    },
    {
      body: t.Object({
        paths: t.Array(t.String()),
      }),
      detail: {
        tags: ["Admin", "CDN"],
        summary: "Bulk download files as ZIP (Admin only)",
        description:
          "Download multiple files from the CDN as a single ZIP archive. Provide an array of file paths.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * Bulk delete files
   * POST /api/admin/cdn/bulk-delete
   * Proxies to: POST /api/bulk-delete on CDN
   */
  .post(
    "/bulk-delete",
    async ({ user, body }) => {
      const authUser = user as AuthUser;
      const requestBody = body as { paths: string[] };

      logger.info(
        {
          context: "CDN Admin",
          userId: authUser.id,
          fileCount: requestBody.paths.length,
        },
        "Admin bulk deleting files from CDN",
      );

      if (!requestBody.paths || requestBody.paths.length === 0) {
        throw new BadRequestError("No file paths provided for deletion");
      }

      const response = await proxyCDNRequest({
        method: "POST",
        endpoint: "/api/bulk-delete",
        body: requestBody,
        contentType: "application/json",
      });

      return response;
    },
    {
      body: t.Object({
        paths: t.Array(t.String()),
      }),
      detail: {
        tags: ["Admin", "CDN"],
        summary: "Bulk delete files (Admin only)",
        description:
          "Delete multiple files from the CDN in a single operation. Use with caution - this operation cannot be undone.",
        security: [{ BearerAuth: [] }],
      },
    },
  )

  /**
   * Validate manifest references
   * GET /api/admin/cdn/validate-references
   * Proxies to: GET /api/validate-references on CDN
   */
  .get(
    "/validate-references",
    async ({ user }) => {
      const authUser = user as AuthUser;
      logger.info(
        { context: "CDN Admin", userId: authUser.id },
        "Admin validating CDN manifest references",
      );

      const response = await proxyCDNRequest({
        method: "GET",
        endpoint: "/api/validate-references",
      });

      return response;
    },
    {
      detail: {
        tags: ["Admin", "CDN"],
        summary: "Validate manifest references (Admin only)",
        description:
          "Validate that all asset manifest references point to files that actually exist on the CDN. Returns a report of missing or broken references.",
        security: [{ BearerAuth: [] }],
      },
    },
  );
