'use client'

import { animate, createTimeline, stagger } from 'animejs'
import React, { useEffect, useRef } from 'react'

/**
 * Wraps the post grid and plays a staggered entrance on mount. The grid
 * items render fully in place beforehand (no CSS opacity: 0) so the page
 * is complete even if this effect never runs — the animation only nudges
 * already-visible content, it doesn't gate visibility on it.
 */
export const RevealGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const items = root.children
    if (!items.length) return

    const tl = createTimeline({ defaults: { ease: 'out(3)', duration: 480 } })
    tl.add(items, {
      translateY: [16, 0],
      opacity: [0.4, 1],
      delay: stagger(70),
    })

    return () => {
      tl.pause()
    }
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

// Re-exported for callers that only need the entrance timeline without the
// wrapper markup (e.g. animating a single featured element imperatively).
export { animate }
