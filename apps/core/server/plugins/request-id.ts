/**
 * Request ID Plugin for Elysia
 * Adds a unique request ID to each request for correlation across logs and error tracking
 *
 * Compatible with Elysia 1.4+
 */

import { Elysia } from "elysia";
import { randomUUID } from "crypto";

export const requestID = () => {
  return new Elysia({ name: "request-id" }).derive(
    { as: "global" },
    ({ request, set }) => {
      // Check if request already has an ID from client (e.g., X-Request-ID header)
      const existingId = request.headers.get("x-request-id");
      const id = existingId || randomUUID();

      // Add request ID to response headers for client-side correlation
      set.headers["x-request-id"] = id;

      return {
        requestID: id,
      };
    },
  );
};
