/**
 * URL validation utility — prevents open redirect and XSS via javascript: / data: schemes.
 *
 * Usage:
 *   import { safeNavigate, isUrlSafe } from "@/lib/urlValidation";
 *   safeNavigate(url);                    // navigates only if safe
 *   safeNavigate(url, { newTab: true });  // opens in new tab if safe
 */

/** Schemes that are always blocked regardless of domain. */
const BLOCKED_SCHEMES = ["javascript:", "data:", "vbscript:", "file:"];

/**
 * Returns true when the URL is safe to navigate to.
 * Rules:
 *  - Must be a valid URL (parseable by the URL constructor)
 *  - Scheme must be https: (http: is allowed for localhost in dev)
 *  - Must NOT match any blocked scheme
 */
export function isUrlSafe(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;

  const trimmed = url.trim();
  if (!trimmed) return false;

  // Block dangerous schemes before even trying to parse
  const lower = trimmed.toLowerCase();
  for (const scheme of BLOCKED_SCHEMES) {
    if (lower.startsWith(scheme)) return false;
  }

  try {
    const parsed = new URL(trimmed);
    // Only allow https (and http for localhost dev)
    if (parsed.protocol === "https:") return true;
    if (parsed.protocol === "http:" && parsed.hostname === "localhost") return true;
    return false;
  } catch {
    return false;
  }
}

export interface SafeNavigateOptions {
  /** Open in a new tab instead of the current window. */
  newTab?: boolean;
}

/**
 * Navigates to `url` only if it passes `isUrlSafe`.
 * Logs a warning and does nothing for unsafe URLs.
 */
export function safeNavigate(
  url: string | null | undefined,
  options: SafeNavigateOptions = {}
): void {
  if (!isUrlSafe(url)) {
    console.warn("[DopeDeal] Blocked unsafe redirect:", url);
    return;
  }

  if (options.newTab) {
    window.open(url!, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url!;
  }
}
