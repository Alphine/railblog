/**
 * Pure helper that turns an arbitrary string (typically a post/page title)
 * into a URL-safe slug.
 *
 * Rules:
 * - Unicode text is normalized and diacritics are stripped (e.g. "café" -> "cafe").
 * - The result is lowercased.
 * - Any run of whitespace or underscores becomes a single hyphen.
 * - Any character that isn't a-z, 0-9, or a hyphen is removed.
 * - Repeated hyphens are collapsed into one.
 * - Leading/trailing hyphens are trimmed.
 *
 * Invalid or empty input (null, undefined, non-string, or a string that
 * normalizes to nothing) safely resolves to an empty string rather than
 * throwing, so callers can treat "" as "no slug could be generated".
 */
export const formatSlug = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
