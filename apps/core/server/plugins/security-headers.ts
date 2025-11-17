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
  // COOP: Allow popups for OAuth flows (required by Privy/Base smart wallets)
  // Must be "same-origin-allow-popups" or "unsafe-none" - NOT "same-origin"
  // See: https://docs.base.org/smart-wallet/quickstart#cross-origin-opener-policy
  set.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups";

  // COEP: Removed to allow Privy embedded wallets to load cross-origin resources
  // Privy's embedded wallet iframe needs to load resources without CORP headers
  // COEP is only needed for SharedArrayBuffer/high-resolution timers, not for auth

  // Additional security headers
  set.headers["X-Content-Type-Options"] = "nosniff";
  set.headers["X-Frame-Options"] = "DENY";
});
