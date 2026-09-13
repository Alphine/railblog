import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  // Fall back to the post's own image, then title, then excerpt when the SEO fields are empty
  const fallbackImage = 'heroImage' in (doc || {}) ? (doc as Partial<Post>)?.heroImage : undefined
  const ogImage = getImageURL(doc?.meta?.image || fallbackImage)

  const baseTitle = doc?.meta?.title || doc?.title
  const title = baseTitle ? baseTitle + ' | RailBlog' : 'RailBlog'

  const description =
    doc?.meta?.description || ('excerpt' in (doc || {}) ? (doc as Partial<Post>)?.excerpt : undefined)

  return {
    description,
    openGraph: mergeOpenGraph({
      description: description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
