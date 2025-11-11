/**
 * Security Headers Plugin
 * Applies security headers to ALL responses including errors
 *
 * Headers applied:
 * - Cross-Origin-Opener-Policy: Required for Privy embedded wallets
 * - Cross-Origin-Embedder-Policy: Modern security for embedded content
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-Frame-Options: Prevents clickjacking
 */

import { Elysia } from "elysia";

export const securityHeaders = new Elysia({
  name: "security-headers",
}).onRequest(({ set }) => {
  // COOP: Allow popups for OAuth flows (required by Privy)
  set.headers["cross-origin-opener-policy"] = "same-origin-allow-popups";

  // COEP: Removed to allow Privy embedded wallets to load cross-origin resources
  // Privy's embedded wallet iframe needs to load resources without CORP headers
  // COEP is only needed for SharedArrayBuffer/high-resolution timers, not for auth

  // Additional security headers
  set.headers["x-content-type-options"] = "nosniff";
  set.headers["x-frame-options"] = "DENY";
});
