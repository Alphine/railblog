import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFind = vi.fn()

// The route calls Payload's Local API (payload.find), never a live DB —
// stub it out entirely so this test touches no database or network.
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: mockFind,
  })),
}))

// Real payload.config.ts pulls in the Postgres adapter and plugins; the
// route only ever passes this value through to the mocked getPayload, so a
// plain placeholder is enough and keeps this test config/DB-independent.
vi.mock('@payload-config', () => ({
  default: {},
}))

// unstable_cache normally memoizes across requests using Next's internal
// request-scoped cache, which doesn't exist outside a real server runtime.
// Unwrap it to the plain function so the route logic runs synchronously.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

const MOCK_POSTS = [
  {
    title: 'First Post',
    slug: 'first-post',
    excerpt: 'The first excerpt',
    publishedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    meta: { description: 'meta description' },
  },
  {
    title: 'Second <Post> & "Special" Chars',
    slug: 'second-post',
    excerpt: null,
    publishedAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    meta: { description: 'fallback description' },
  },
  {
    // Posts without a slug should never be linked to from the feed.
    title: 'No Slug Post',
    slug: null,
    excerpt: 'unused',
    publishedAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    meta: {},
  },
]

describe('GET /rss.xml', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFind.mockReset()
    mockFind.mockResolvedValue({ docs: MOCK_POSTS })
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example-blog.test'
  })

  it('returns well-formed RSS XML with the expected channel and item fields', async () => {
    const { GET } = await import('@/app/(frontend)/rss.xml/route')

    const response = await GET()
    const xml = await response.text()

    expect(response.headers.get('Content-Type')).toContain('application/xml')

    // Well-formed XML declaration + a single root <rss> element.
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toMatch(/<rss version="2.0"[^>]*>[\s\S]*<\/rss>/)
    expect(xml).toContain('<channel>')
    expect(xml).toContain('</channel>')

    // Channel-level fields.
    expect(xml).toContain('<link>https://example-blog.test</link>')

    // Only posts with a slug are queried against Payload's Local API, not a live DB.
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'posts',
        overrideAccess: false,
        draft: false,
        where: { _status: { equals: 'published' } },
      }),
    )

    // Item for the first post.
    expect(xml).toContain('<title>First Post</title>')
    expect(xml).toContain('<link>https://example-blog.test/posts/first-post</link>')
    expect(xml).toContain('<pubDate>Thu, 01 Jan 2026 00:00:00 GMT</pubDate>')
    expect(xml).toContain('<description>The first excerpt</description>')

    // Second post: excerpt is falsy, so it falls back to meta.description,
    // and unsafe characters in the title must be XML-escaped.
    expect(xml).toContain('<title>Second &lt;Post&gt; &amp; &quot;Special&quot; Chars</title>')
    expect(xml).toContain('<description>fallback description</description>')

    // The slug-less post must be excluded entirely.
    expect(xml).not.toContain('No Slug Post')
  })

  it('produces exactly one <item> per linkable post', async () => {
    const { GET } = await import('@/app/(frontend)/rss.xml/route')

    const response = await GET()
    const xml = await response.text()

    const itemCount = (xml.match(/<item>/g) || []).length
    expect(itemCount).toBe(2)
  })

  it('omits the feed body entirely when there are no published posts', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    const { GET } = await import('@/app/(frontend)/rss.xml/route')

    const response = await GET()
    const xml = await response.text()

    expect(xml).not.toContain('<item>')
    expect(xml).toContain('<channel>')
  })
})
