/**
 * Turns plain text into the minimal valid Lexical document shape Payload's
 * richText field expects — one paragraph node per non-empty line. This is
 * intentionally simple (no bold/links/headings): the dashboard's composer
 * is a fast-path for short posts, not a replacement for the full Lexical
 * editor in /admin, which still handles rich formatting.
 */
export function textToLexical(body: string) {
  const lines = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const paragraphs = (lines.length > 0 ? lines : ['']).map((line) => ({
    type: 'paragraph',
    children: [{ type: 'text', text: line, version: 1 }],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  }))

  return {
    root: {
      type: 'root',
      children: paragraphs,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}
