'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { formatSlug } from '@/utilities/formatSlug'
import { textToLexical } from './textToLexical'

export type CreatePostInput = {
  title: string
  excerpt: string
  body: string
  categoryIds: string[]
  status: 'draft' | 'published'
}

export type CreatePostResult = { ok: true; slug: string } | { ok: false; error: string }

export async function createPost(input: CreatePostInput): Promise<CreatePostResult> {
  const title = input.title.trim()
  if (!title) {
    return { ok: false, error: 'Title is required.' }
  }
  if (!input.body.trim()) {
    return { ok: false, error: 'Post content is required.' }
  }

  const payload = await getPayload({ config: configPromise })
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    return { ok: false, error: 'You must be signed in to publish a post.' }
  }

  let userId: number
  try {
    const { user } = await payload.auth({
      headers: new Headers({ Authorization: `JWT ${token}` }),
    })
    if (!user) {
      return { ok: false, error: 'You must be signed in to publish a post.' }
    }
    userId = user.id
  } catch {
    return { ok: false, error: 'Your session has expired — sign in again.' }
  }

  const slug = formatSlug(title)

  try {
    const post = await payload.create({
      collection: 'posts',
      draft: input.status === 'draft',
      data: {
        title,
        slug,
        excerpt: input.excerpt.trim() || undefined,
        content: textToLexical(input.body),
        categories: input.categoryIds.map(Number),
        authors: [userId],
        _status: input.status,
      },
    })

    revalidatePath('/dashboard')
    if (input.status === 'published') {
      revalidatePath('/posts')
      revalidatePath(`/posts/${post.slug}`)
    }

    return { ok: true, slug: String(post.slug) }
  } catch (error) {
    payload.logger.error({ err: error }, 'Failed to create post from the dashboard composer')
    return { ok: false, error: 'Something went wrong saving the post. Please try again.' }
  }
}
