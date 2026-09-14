'use client'

import { animate, createTimeline, stagger } from 'animejs'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import { formatSlug } from '@/utilities/formatSlug'
import { createPost } from './actions'

type Category = { id: string; title: string }
type RecentPost = { id: string; title: string; status: 'draft' | 'published'; updatedAt: string }
type Status = 'draft' | 'published'

export const PostComposer: React.FC<{
  authorName: string
  categories: Category[]
  recentPosts: RecentPost[]
}> = ({ authorName, categories, recentPosts }) => {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('draft')
  const [publishing, setPublishing] = useState(false)
  const [showCheck, setShowCheck] = useState(false)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const sidebarRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const checkPathRef = useRef<SVGPathElement>(null)
  const toastRef = useRef<HTMLDivElement>(null)
  const publishBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const rows = sidebarRef.current?.querySelectorAll('[data-reveal-row]')
    const tl = createTimeline({ defaults: { ease: 'out(3)', duration: 440 } })
    if (rows?.length) {
      tl.add(Array.from(rows), { translateX: [-10, 0], opacity: [0.4, 1], delay: stagger(60) }, 0)
    }
    if (composerRef.current) {
      tl.add(composerRef.current, { translateY: [14, 0], opacity: [0.4, 1] }, 80)
    }
    return () => {
      tl.pause()
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const el = toastRef.current
    if (el) {
      animate(el, { translateY: [24, 0], opacity: [0, 1], duration: 380, ease: 'out(3)' })
    }
    const timer = setTimeout(() => {
      const el2 = toastRef.current
      if (el2) {
        animate(el2, {
          translateY: [0, 16],
          opacity: [1, 0],
          duration: 300,
          ease: 'inOut(2)',
          onComplete: () => setToast(null),
        })
      } else {
        setToast(null)
      }
    }, 2400)
    return () => clearTimeout(timer)
  }, [toast])

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  async function handlePublish() {
    if (publishing) return
    setPublishing(true)

    if (publishBtnRef.current) {
      animate(publishBtnRef.current, { scale: [1, 0.95, 1], duration: 340, ease: 'out(3)' })
    }

    const result = await createPost({
      title,
      excerpt,
      body,
      categoryIds: selectedCategoryIds,
      status,
    })

    if (result.ok) {
      setShowCheck(true)
      requestAnimationFrame(() => {
        if (checkPathRef.current) {
          animate(checkPathRef.current, { strokeDashoffset: [24, 0], duration: 320, ease: 'out(2)' })
        }
      })
      setToast({
        kind: 'success',
        message: status === 'published' ? 'Post published.' : 'Draft saved.',
      })
      setTitle('')
      setExcerpt('')
      setBody('')
      setSelectedCategoryIds([])
      setStatus('draft')
    } else {
      setToast({ kind: 'error', message: result.error })
    }

    setShowCheck(false)
    setPublishing(false)
  }

  const slug = formatSlug(title) || 'post-title'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-8 py-5">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono font-semibold">RailBlog</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-muted-foreground">Posting dashboard</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{authorName}</span>
          <Link href="/admin" className="font-mono underline underline-offset-2">
            Full admin →
          </Link>
        </div>
      </div>

      <div className="grid flex-1" style={{ gridTemplateColumns: '300px 1fr' }}>
        {/* sidebar */}
        <div
          ref={sidebarRef}
          className="flex flex-col gap-1 border-r border-border bg-card p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Recent posts
            </span>
          </div>

          {recentPosts.length === 0 && (
            <p className="text-sm text-muted-foreground">No posts yet — publish your first one.</p>
          )}

          {recentPosts.map((post) => (
            <div
              key={post.id}
              data-reveal-row
              className="rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <div className="mb-1 text-[13.5px] font-semibold">{post.title}</div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-foreground ${
                    post.status === 'published' ? 'bg-success/30' : 'bg-warning/30'
                  }`}
                >
                  {post.status}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  {new Date(post.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* composer */}
        <div ref={composerRef} className="max-w-2xl px-14 py-10">
          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-1.5 w-full border-none bg-transparent p-0 text-[38px] outline-none"
            style={{ fontFamily: 'var(--font-sans)' }}
          />
          <div className="mb-7 font-mono text-xs text-muted-foreground">/posts/{slug}</div>

          <textarea
            placeholder="Write a one-sentence excerpt readers will see on the index page…"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="mb-4 w-full resize-y rounded-lg border border-border p-3.5 text-sm leading-relaxed"
          />

          <textarea
            placeholder="Post content — one paragraph per line. For rich formatting (headings, embeds, images), finish the post in the full admin editor instead."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="mb-6 w-full resize-y rounded-lg border border-border p-3.5 text-sm leading-relaxed"
          />

          <div className="mb-7">
            <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
              Categories
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  No categories yet — add some in the full admin.
                </span>
              )}
              {categories.map((cat) => {
                const active = selectedCategoryIds.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="rounded-full border px-3.5 py-1.5 font-mono text-[11.5px] font-semibold transition-colors"
                    style={
                      active
                        ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: 'var(--primary-foreground)' }
                        : { background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                    }
                  >
                    {cat.title}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-6">
            <div className="relative flex w-[180px] rounded-lg bg-muted p-[3px]">
              <div
                className="absolute top-[3px] bottom-[3px] w-[87px] rounded-md bg-card shadow-sm transition-transform duration-200"
                style={{ transform: `translateX(${status === 'draft' ? 0 : 87}px)` }}
              />
              <button
                type="button"
                onClick={() => setStatus('draft')}
                className="relative flex-1 py-1.5 font-mono text-[11.5px] font-semibold"
                style={{ color: status === 'draft' ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setStatus('published')}
                className="relative flex-1 py-1.5 font-mono text-[11.5px] font-semibold"
                style={{ color: status === 'published' ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
                Published
              </button>
            </div>

            <button
              ref={publishBtnRef}
              type="button"
              onClick={handlePublish}
              disabled={publishing || !title.trim() || !body.trim()}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {showCheck && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path ref={checkPathRef} d="M4 12 L9.5 18 L20 6" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} />
                </svg>
              )}
              {publishing ? 'Saving…' : status === 'published' ? 'Publish' : 'Save draft'}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div
          ref={toastRef}
          className="fixed bottom-7 right-7 flex items-center gap-2.5 rounded-lg px-5 py-3.5 shadow-lg"
          style={{
            background: toast.kind === 'error' ? 'var(--destructive)' : 'var(--foreground)',
            color: 'var(--background)',
          }}
        >
          {toast.kind === 'success' && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12 L11 15 L16 9" />
            </svg>
          )}
          <span className="font-mono text-xs">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
