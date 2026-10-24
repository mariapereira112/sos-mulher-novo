/**
 * Returns the public base URL of this API server.
 *
 * Resolution order (first non-empty wins):
 *  1. APP_BASE_URL      — explicit override for any deployment environment
 *  2. REPLIT_DOMAINS    — auto-set by Replit hosting (comma-separated)
 *  3. localhost:PORT     — local development fallback
 *
 * Consumers of this function must NOT append a trailing slash.
 */
export function getApiBaseUrl(): string {
  const explicit = process.env["APP_BASE_URL"];
  if (explicit) return explicit.replace(/\/$/, "");
  const domains = process.env["REPLIT_DOMAINS"];
  if (domains) return `https://${domains.split(",")[0]!.trim()}`;
  return `http://localhost:${process.env["PORT"] ?? "8080"}`;
}
