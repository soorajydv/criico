export const DEFAULT_AFTER_LOGIN = "/dashboard";

/**
 * Only follow `?from=` values that are paths on this site. Anything else
 * ("https://evil.example", "//evil.example", "/\\evil.example") would turn
 * the login page into an open redirect.
 */
export function safeRedirectPath(from: string | null | undefined, fallback = DEFAULT_AFTER_LOGIN): string {
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) {
    return fallback;
  }
  return from;
}
