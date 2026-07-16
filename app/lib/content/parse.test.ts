import { describe, expect, it } from 'vite-plus/test'
import { extractTextFromAst } from './corpus.ts'
import { parseMusubiMarkdown } from './parse.ts'
import type { MusubiCallout } from './types.ts'

function parseCallout(content: string): { callout: MusubiCallout; text: string } {
  const document = parseMusubiMarkdown(`<callout>\n${content}\n</callout>`, {
    pageLabel: 'Callout fixture',
  })
  const callout = document.children[0]
  expect(callout?.type).toBe('callout')
  return {
    callout: callout as MusubiCallout,
    text: extractTextFromAst(document),
  }
}

describe('semantic Callout declarations', () => {
  it.each([
    ['{note}Body', 'note', 'Body'],
    ['{type=note}Body', 'note', 'Body'],
    ['{warning}Body', 'warning', 'Body'],
    ['{ type = WARNING }Body', 'warning', 'Body'],
    ['  { error } Body', 'error', ' Body'],
    ['{type = error}\nBody', 'error', 'Body'],
  ] as const)('recognizes %s', (source, role, visible) => {
    const result = parseCallout(source)
    expect(result.callout.role).toBe(role)
    expect(result.text).toBe(visible)
  })

  it.each([
    ['{info}', '{info}'],
    ['{warning', '{warning'],
    ['{type=warning', '{type=warning'],
    ['Ordinary text {warning}', 'Ordinary text {warning}'],
    ['Ordinary text\n{warning}', 'Ordinary text\n{warning}'],
  ])('keeps unsupported brace text literal: %s', (source, visible) => {
    const result = parseCallout(source)
    expect(result.callout.role).toBe('note')
    expect(result.text).toBe(visible)
  })

  it('removes a declaration-only first paragraph without removing later blocks', () => {
    const result = parseCallout('{warning}\n\nSecond paragraph.')
    expect(result.callout.role).toBe('warning')
    expect(result.callout.children).toHaveLength(1)
    expect(result.text).toBe('Second paragraph.')
  })

  it('preserves inline formatting after a declaration', () => {
    const result = parseCallout('{error} **Important** detail.')
    expect(result.callout.role).toBe('error')
    expect(result.text).toBe(' Important detail.')
  })

  it('restores braces in Callout link and image fields', () => {
    const linkResult = parseCallout('[templated](https://example.com/{id} "title {draft}")')
    const linkParagraph = linkResult.callout.children[0]
    expect(linkParagraph?.type).toBe('paragraph')
    if (linkParagraph?.type !== 'paragraph') throw new Error('Expected a Callout paragraph')
    const link = linkParagraph.children[0]
    expect(link?.type).toBe('link')
    if (link?.type !== 'link') throw new Error('Expected a Callout link')
    expect(link.url).toBe('https://example.com/{id}')
    expect(link.title).toBe('title {draft}')

    const imageResult = parseCallout(
      '![alt {draft}](https://example.com/image.png "title {draft}")',
    )
    const image = imageResult.callout.children[0]
    expect(image?.type).toBe('image')
    if (image?.type !== 'image') throw new Error('Expected a Callout image')
    expect(image.alt).toBe('alt {draft}')
    expect(image.caption).toBe('alt {draft}')
    expect(image.title).toBe('title {draft}')
    expect(JSON.stringify(imageResult.callout)).not.toMatch(/[\uE000\uE001]/u)
  })

  it('keeps Notion JSX blocks while rejecting attribute expressions', () => {
    const tableOfContents = parseMusubiMarkdown('<table_of_contents />', {
      pageLabel: 'JSX fixture',
    })
    expect(tableOfContents.children[0]?.type).toBe('tableOfContents')
    expect(() =>
      parseMusubiMarkdown('<table_of_contents color={value} />', {
        pageLabel: 'Unsafe attribute fixture',
      }),
    ).toThrow(/literal string attributes/u)
  })

  it('treats Notion empty blocks as spacing rather than public content', () => {
    const document = parseMusubiMarkdown('Before\n<empty-block/>\nAfter', {
      pageLabel: 'Empty block fixture',
    })
    expect(extractTextFromAst(document)).toBe('Before\nAfter')
  })
})