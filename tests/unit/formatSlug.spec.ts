import { describe, expect, it } from 'vitest'

import { formatSlug } from '@/utilities/formatSlug'

describe('formatSlug', () => {
  it('lowercases and hyphenates a normal title', () => {
    expect(formatSlug('Hello World')).toBe('hello-world')
  })

  it('collapses multiple spaces into a single hyphen', () => {
    expect(formatSlug('Hello    World')).toBe('hello-world')
  })

  it('strips punctuation and special characters', () => {
    expect(formatSlug("What's New? A/B Testing @ Scale!")).toBe('whats-new-ab-testing-scale')
  })

  it('normalizes accented characters', () => {
    expect(formatSlug('Café con Leche')).toBe('cafe-con-leche')
  })

  it('converts underscores to hyphens', () => {
    expect(formatSlug('my_post_title')).toBe('my-post-title')
  })

  it('collapses runs of hyphens produced by adjacent invalid characters', () => {
    expect(formatSlug('foo -- bar')).toBe('foo-bar')
  })

  it('trims leading and trailing hyphens', () => {
    expect(formatSlug('  -Leading and trailing-  ')).toBe('leading-and-trailing')
  })

  it('is idempotent when applied to an already-valid slug', () => {
    const slug = formatSlug('Already A Valid Slug')
    expect(formatSlug(slug)).toBe(slug)
  })

  it('normalizes invalid input (empty string) to an empty string rather than throwing', () => {
    expect(formatSlug('')).toBe('')
    expect(formatSlug('   ')).toBe('')
    expect(formatSlug('!!!')).toBe('')
  })

  it('normalizes non-string input to an empty string rather than throwing', () => {
    expect(formatSlug(undefined)).toBe('')
    expect(formatSlug(null)).toBe('')
    expect(formatSlug(42)).toBe('')
    expect(formatSlug({})).toBe('')
  })

  it('preserves numbers', () => {
    expect(formatSlug('Top 10 Reasons in 2026')).toBe('top-10-reasons-in-2026')
  })
})
