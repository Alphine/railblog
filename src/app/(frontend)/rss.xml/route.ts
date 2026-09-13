import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * RSS 2.0 feed of published posts, generated through Payload's Local API
 * (not an internal HTTP round-trip to this same app).
 */
const getFeedPosts = unstable_cache(
  async () => {
    const payload = await getPayload({ config })

    const results = await payload.find({
      collection: 'posts',
      overrideAccess: false,
      draft: false,
      depth: 1,
      limit: 50,
      sort: '-publishedAt',
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        updatedAt: true,
        meta: {
          description: true,
        },
      },
    })

    return results.docs
  },
  ['rss-feed-posts'],
  {
    tags: ['posts-sitemap'],
  },
)

const escapeXml = (unsafe: string): string =>
  unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })

export async function GET() {
  const SITE_URL = getServerSideURL()
  const posts = await getFeedPosts()

  const items = posts
    .filter((post) => Boolean(post?.slug))
    .map((post) => {
      const link = `${SITE_URL}/posts/${post.slug}`
      const description = post.excerpt || post.meta?.description || ''
      const pubDate = new Date(post.publishedAt || post.updatedAt).toUTCString()

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`
    })
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RailBlog</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Latest posts from RailBlog</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
