import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'

import { getMeUser } from '@/utilities/getMeUser'
import { PostComposer } from './PostComposer'

// Reads the logged-in user, the current post list, and categories on every
// request — never statically prerendered (there's no live database at
// build time, and this page is meaningless without a real session anyway).
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { user } = await getMeUser({ nullUserRedirect: '/admin/login' })

  const payload = await getPayload({ config: configPromise })

  const [categoriesResult, postsResult] = await Promise.all([
    payload.find({
      collection: 'categories',
      limit: 20,
      sort: 'title',
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'posts',
      limit: 8,
      sort: '-updatedAt',
      depth: 0,
      overrideAccess: false,
      user,
      select: { title: true, slug: true, _status: true, updatedAt: true },
    }),
  ])

  return (
    <PostComposer
      authorName={user.email}
      categories={categoriesResult.docs.map((c) => ({ id: String(c.id), title: c.title }))}
      recentPosts={postsResult.docs.map((p) => ({
        id: String(p.id),
        title: p.title,
        status: p._status === 'published' ? 'published' : 'draft',
        updatedAt: p.updatedAt,
      }))}
    />
  )
}
