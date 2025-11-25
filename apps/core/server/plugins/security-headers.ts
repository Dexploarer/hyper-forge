/**
 * Security Headers Plugin
 * Applies security headers to ALL responses including errors
 *
 * Headers applied:
 * - Cross-Origin-Opener-Policy: Required for Privy embedded wallets
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Legacy XSS protection (for older browsers)
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 * - Strict-Transport-Security: Forces HTTPS (production only)
 */

import { Elysia } from "elysia";

const isProduction = process.env.NODE_ENV === "production";

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

  // Prevent MIME sniffing
  set.headers["X-Content-Type-Options"] = "nosniff";

  // Prevent clickjacking
  set.headers["X-Frame-Options"] = "DENY";

  // Legacy XSS protection (for older browsers)
  set.headers["X-XSS-Protection"] = "1; mode=block";

  // Control referrer information
  set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

  // Restrict browser features
  set.headers["Permissions-Policy"] =
    "geolocation=(), microphone=(), camera=(), payment=()";

  // HSTS - Force HTTPS in production (1 year, include subdomains)
  if (isProduction) {
    set.headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains";
  }
});
