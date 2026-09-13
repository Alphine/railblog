import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFind = vi.fn()

// Stub the Payload Local API entirely — the route must never touch a real
// database in this test.
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    find: mockFind,
  })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

const MOCK_POSTS = [
  { slug: 'first-post', updatedAt: '2026-01-02T00:00:00.000Z' },
  { slug: 'second-post', updatedAt: '2026-02-01T00:00:00.000Z' },
  // A doc missing a slug should be filtered out of the sitemap.
  { slug: null, updatedAt: '2026-03-01T00:00:00.000Z' },
]

describe('GET /posts-sitemap.xml', () => {
  beforeEach(() => {
    vi.resetModules()
    mockFind.mockReset()
    mockFind.mockResolvedValue({ docs: MOCK_POSTS })
    process.env.NEXT_PUBLIC_SERVER_URL = 'https://example-blog.test'
  })

  it('returns a well-formed XML sitemap listing the mocked posts', async () => {
    const { GET } = await import('@/app/(frontend)/(sitemaps)/posts-sitemap.xml/route')

    const response = await GET()
    const xml = await response.text()

    expect(response.headers.get('Content-Type')).toContain('xml')

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toMatch(/<urlset[^>]*>[\s\S]*<\/urlset>/)

    expect(xml).toContain('<loc>https://example-blog.test/posts/first-post</loc>')
    expect(xml).toContain('<loc>https://example-blog.test/posts/second-post</loc>')

    // Only published posts should ever be requested from Payload.
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'posts',
        overrideAccess: false,
        draft: false,
        where: { _status: { equals: 'published' } },
      }),
    )

    // Exactly the two slugged posts should appear as <url> entries.
    const urlCount = (xml.match(/<url>/g) || []).length
    expect(urlCount).toBe(2)
  })

  it('produces an empty (but still well-formed) urlset when there are no published posts', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    const { GET } = await import('@/app/(frontend)/(sitemaps)/posts-sitemap.xml/route')

    const response = await GET()
    const xml = await response.text()

    expect(xml).toMatch(/<urlset[^>]*\/>|<urlset[^>]*>\s*<\/urlset>/)
    expect(xml).not.toContain('<url>')
  })
})
