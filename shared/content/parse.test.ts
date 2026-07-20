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

describe('Notion block-boundary separation', () => {
  function types(markdown: string): string[] {
    return parseMusubiMarkdown(markdown, { pageLabel: 'Boundary fixture' }).children.map(
      (block) => {
        if (block.type === 'heading') return `heading:${block.depth}`
        if (block.type === 'list') return `list:${block.children.length}`
        return block.type
      },
    )
  }

  it('splits adjacent Notion paragraphs joined by a single newline', () => {
    expect(types('First paragraph.\nSecond paragraph.')).toEqual(['paragraph', 'paragraph'])
  })

  it('keeps soft breaks that Notion encodes as br tags inside one paragraph', () => {
    const document = parseMusubiMarkdown('Line one<br>Line two', {
      pageLabel: 'Boundary fixture',
    })
    expect(document.children).toHaveLength(1)
    const paragraph = document.children[0]
    expect(paragraph?.type).toBe('paragraph')
    if (paragraph?.type !== 'paragraph') throw new Error('Expected a paragraph')
    expect(paragraph.children.map((node) => node.type)).toEqual(['text', 'break', 'text'])
  })

  it('treats a bare thematic break after a paragraph as a divider, not a setext heading', () => {
    expect(types('Closing thought.\n---\nNext paragraph.')).toEqual([
      'paragraph',
      'divider',
      'paragraph',
    ])
  })

  it('ends a list before the following paragraph', () => {
    expect(types('- alpha\n- beta\nAfter the list.')).toEqual(['list:2', 'paragraph'])
  })

  it('keeps tight nested lists without inserting loose-list blank lines', () => {
    const document = parseMusubiMarkdown('- foo\n\t- bar\n\t\t- baz\n- qux', {
      pageLabel: 'Boundary fixture',
    })
    expect(document.children).toHaveLength(1)
    expect(document.children[0]?.type).toBe('list')
    if (document.children[0]?.type !== 'list') throw new Error('Expected a list')
    expect(document.children[0].children).toHaveLength(2)
    const nested = document.children[0].children[0]?.children.find((child) => child.type === 'list')
    expect(nested?.type).toBe('list')
  })

  it('does not insert blank lines inside fenced code', () => {
    const document = parseMusubiMarkdown('```\nline one\nline two\n```\nAfter', {
      pageLabel: 'Boundary fixture',
    })
    expect(types('```\nline one\nline two\n```\nAfter')).toEqual(['code', 'paragraph'])
    const code = document.children[0]
    expect(code?.type).toBe('code')
    if (code?.type !== 'code') throw new Error('Expected a code block')
    expect(code.value).toBe('line one\nline two')
  })

  it('ends a blockquote before the following paragraph', () => {
    expect(types('> Quoted line.\nFollowing paragraph.')).toEqual(['quote', 'paragraph'])
  })

  it('keeps a Notion-shaped tab-indented callout and retains icon/color without requiring them for render', () => {
    const document = parseMusubiMarkdown(
      '<callout icon="💡" color="blue_bg">\n\t**The core insight:** body\n</callout>\nAfter',
      { pageLabel: 'Boundary fixture' },
    )
    expect(document.children.map((block) => block.type)).toEqual(['callout', 'paragraph'])
    const callout = document.children[0]
    expect(callout?.type).toBe('callout')
    if (callout?.type !== 'callout') throw new Error('Expected a callout')
    expect(callout.icon).toBe('💡')
    expect(callout.color).toBe('blue_bg')
    expect(callout.role).toBe('note')
    expect(callout.children).toHaveLength(1)
    expect(
      extractTextFromAst({
        type: 'document',
        pageLabel: 'x',
        children: callout.children,
        tableOfContents: [],
      }),
    ).toContain('The core insight')
  })

  it('keeps multi-line Notion HTML tables as one table block', () => {
    expect(
      types(
        '<table header-row="true">\n<tr>\n<td>A</td>\n<td>B</td>\n</tr>\n<tr>\n<td>1</td>\n<td>2</td>\n</tr>\n</table>\nAfter',
      ),
    ).toEqual(['table', 'paragraph'])
  })

  it('splits tab-indented adjacent paragraphs inside a Notion callout', () => {
    const document = parseMusubiMarkdown(
      '<callout icon="💡">\n\tFirst callout paragraph.\n\tSecond callout paragraph.\n</callout>',
      { pageLabel: 'Boundary fixture' },
    )
    const callout = document.children[0]
    expect(callout?.type).toBe('callout')
    if (callout?.type !== 'callout') throw new Error('Expected a callout')
    expect(callout.children.map((child) => child.type)).toEqual(['paragraph', 'paragraph'])
  })

  it('keeps an indented continuation under a list item without requiring blank lines', () => {
    const document = parseMusubiMarkdown('- item head\n  still the same item\n- next item', {
      pageLabel: 'Boundary fixture',
    })
    expect(document.children).toHaveLength(1)
    expect(document.children[0]?.type).toBe('list')
    if (document.children[0]?.type !== 'list') throw new Error('Expected a list')
    expect(document.children[0].children).toHaveLength(2)
  })
})