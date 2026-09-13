import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import { safeGenerateStaticParams } from '@/utilities/safeGenerateStaticParams'

export const revalidate = 600

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function CategoryPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    limit: 1,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const category = categories.docs?.[0]

  if (!category) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    sort: '-publishedAt',
    where: {
      categories: {
        in: [category.id],
      },
    },
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      excerpt: true,
      heroImage: true,
      publishedAt: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{category.title}</h1>
          <p>Posts filed under &ldquo;{category.title}&rdquo;.</p>
        </div>
      </div>

      {posts.docs.length > 0 ? (
        <CollectionArchive posts={posts.docs} />
      ) : (
        <div className="container">No posts in this category yet.</div>
      )}
    </div>
  )
}

export async function generateStaticParams() {
  return safeGenerateStaticParams('categories/[slug]', async () => {
    const payload = await getPayload({ config: configPromise })
    const categories = await payload.find({
      collection: 'categories',
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: {
        slug: true,
      },
    })

    return categories.docs
      .filter((category) => Boolean(category.slug))
      .map(({ slug }) => ({ slug: slug as string }))
  })
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    limit: 1,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const category = categories.docs?.[0]

  return {
    title: category ? `${category.title} | RailBlog` : 'Category | RailBlog',
  }
}
