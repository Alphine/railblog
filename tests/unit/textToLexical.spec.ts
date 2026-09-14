import { describe, expect, it } from 'vitest'

import { textToLexical } from '@/app/(frontend)/dashboard/textToLexical'

describe('textToLexical', () => {
  it('turns each non-empty line into its own paragraph node', () => {
    const doc = textToLexical('First paragraph.\nSecond paragraph.')

    expect(doc.root.type).toBe('root')
    expect(doc.root.children).toHaveLength(2)
    expect(doc.root.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: 'First paragraph.' }],
    })
    expect(doc.root.children[1]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', text: 'Second paragraph.' }],
    })
  })

  it('collapses blank lines instead of emitting empty paragraphs', () => {
    const doc = textToLexical('One.\n\n\nTwo.')
    expect(doc.root.children).toHaveLength(2)
  })

  it('trims whitespace around each line', () => {
    const doc = textToLexical('  padded line  ')
    expect(doc.root.children[0].children[0].text).toBe('padded line')
  })

  it('produces a single empty paragraph for empty input, never a crash', () => {
    const doc = textToLexical('')
    expect(doc.root.children).toHaveLength(1)
    expect(doc.root.children[0].children[0].text).toBe('')
  })

  it('every node carries the fields Payload\'s Lexical field requires', () => {
    const doc = textToLexical('Hello')
    expect(doc.root).toMatchObject({ direction: 'ltr', format: '', indent: 0, version: 1 })
    expect(doc.root.children[0]).toMatchObject({ direction: 'ltr', format: '', indent: 0, version: 1 })
  })
})
