import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

/**
 * The RailBlog wordmark. Fixed white fill/stroke on purpose — callers wrap
 * it with `invert dark:invert-0` (see Header) to flip it dark on a light
 * background, exactly like the asset it replaces; the footer (always on a
 * dark bg) renders it as-is with no wrapper needed.
 */
export const Logo = (props: Props) => {
  const { className } = props

  return (
    <span className={clsx('inline-flex items-center gap-2 h-[34px] w-fit', className)}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 17 L10 5 L14 5 L20 17" />
        <path d="M7.2 11 H16.8" />
        <path d="M2.5 20.5 H21.5" />
      </svg>
      <span
        style={{
          color: '#fff',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          fontSize: '16px',
          letterSpacing: '0.01em',
          lineHeight: 1,
        }}
      >
        RailBlog
      </span>
    </span>
  )
}
