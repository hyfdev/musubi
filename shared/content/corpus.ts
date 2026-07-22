import { extractInlineText } from './headings.ts'
import type { MusubiBlock, MusubiDocument, MusubiInline, MusubiTableCell } from './types.ts'

export function extractTextFromAst(document: MusubiDocument): string {
  return document.children.flatMap(extractBlockText).filter(Boolean).join('\n')
}

export const extractCorpusText = extractTextFromAst

export interface DocumentFontCorpora {
  text: string
  code: string
}

export function extractFontCorporaFromAst(document: MusubiDocument): DocumentFontCorpora {
  const text: string[] = []
  const code: string[] = []
  for (const block of document.children) collectBlockFontCorpora(block, text, code)
  return { text: text.filter(Boolean).join('\n'), code: code.filter(Boolean).join('\n') }
}

/**
 * Flattens one rendered inline run for Chinese typography classification. Inline markup stays
 * transparent, while visual line breaks and inline-code font boundaries become newlines. Each
 * inline-code replacement keeps the same UTF-16 length so Vue can reuse the string for offsets.
 */
export function extractInlineTypographyContext(nodes: readonly MusubiInline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return node.value
        case 'inlineCode':
          return '\n'.repeat(node.value.length)
        case 'break':
          return '\n'
        case 'strong':
        case 'emphasis':
        case 'delete':
        case 'link':
          return extractInlineTypographyContext(node.children)
      }
    })
    .join('')
}

export interface TypographyCorpora {
  body: string
  emphasis: string
}

function collectBlockFontCorpora(block: MusubiBlock, text: string[], code: string[]): void {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      collectInlineFontCorpora(block.children, text, code)
      return
    case 'code':
      code.push(block.language ?? '', block.value)
      return
    case 'list':
      for (const item of block.children) {
        for (const child of item.children) collectBlockFontCorpora(child, text, code)
      }
      return
    case 'quote':
    case 'callout':
      for (const child of block.children) collectBlockFontCorpora(child, text, code)
      return
    case 'image':
      text.push(block.alt, block.caption ?? '')
      return
    case 'file':
      collectInlineFontCorpora(block.children, text, code)
      return
    case 'table':
      for (const row of block.children) {
        for (const cell of row.children) collectInlineFontCorpora(cell.children, text, code)
      }
      return
    case 'xEmbed':
      text.push('X')
      return
    case 'divider':
    case 'tableOfContents':
      return
  }
}

function collectInlineFontCorpora(
  nodes: readonly MusubiInline[],
  text: string[],
  code: string[],
): void {
  text.push(extractInlineTypographyContext(nodes))
  for (const node of nodes) {
    switch (node.type) {
      case 'inlineCode':
        code.push(node.value)
        break
      case 'strong':
      case 'emphasis':
      case 'delete':
      case 'link':
        collectInlineCodeCorpora(node.children, code)
        break
      case 'text':
      case 'break':
        break
    }
  }
}

function collectInlineCodeCorpora(nodes: readonly MusubiInline[], code: string[]): void {
  for (const node of nodes) {
    switch (node.type) {
      case 'inlineCode':
        code.push(node.value)
        break
      case 'strong':
      case 'emphasis':
      case 'delete':
      case 'link':
        collectInlineCodeCorpora(node.children, code)
        break
      case 'text':
      case 'break':
        break
    }
  }
}

export function extractTypographyCorpora(document: MusubiDocument): TypographyCorpora {
  const body: string[] = []
  const emphasis: string[] = []
  const includesTableOfContents = document.children.some(containsTableOfContents)
  for (const block of document.children) {
    collectBlockTypography(block, body, emphasis, includesTableOfContents)
  }
  return { body: body.filter(Boolean).join('\n'), emphasis: emphasis.filter(Boolean).join('\n') }
}

function collectBlockTypography(
  block: MusubiBlock,
  body: string[],
  emphasis: string[],
  includeHeadingInBody: boolean,
): void {
  switch (block.type) {
    case 'paragraph':
      collectInlineTypography(block.children, 'body', body, emphasis)
      return
    case 'heading':
      collectInlineTypography(block.children, 'emphasis', body, emphasis)
      if (includeHeadingInBody) {
        collectInlineTypography(block.children, 'body', body, emphasis)
      }
      return
    case 'code':
      body.push(block.value)
      return
    case 'list':
      for (const item of block.children) {
        for (const child of item.children) {
          collectBlockTypography(child, body, emphasis, includeHeadingInBody)
        }
      }
      return
    case 'quote':
    case 'callout':
      for (const child of block.children) {
        collectBlockTypography(child, body, emphasis, includeHeadingInBody)
      }
      return
    case 'image':
      body.push(block.alt, block.caption ?? '')
      return
    case 'file':
      collectInlineTypography(block.children, 'body', body, emphasis)
      return
    case 'table':
      for (const row of block.children) {
        for (const cell of row.children) {
          collectInlineTypography(cell.children, 'body', body, emphasis)
        }
      }
      return
    case 'xEmbed':
      body.push('X')
      return
    case 'divider':
    case 'tableOfContents':
      return
  }
}

function collectInlineTypography(
  nodes: readonly MusubiInline[],
  role: 'body' | 'emphasis',
  body: string[],
  emphasis: string[],
): void {
  const destination = role === 'body' ? body : emphasis
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        destination.push(node.value)
        break
      case 'inlineCode':
        body.push(node.value)
        break
      case 'break':
        destination.push('\n')
        break
      case 'strong':
      case 'emphasis':
        collectInlineTypography(node.children, 'emphasis', body, emphasis)
        break
      case 'delete':
      case 'link':
        collectInlineTypography(node.children, role, body, emphasis)
        break
    }
  }
}

function containsTableOfContents(block: MusubiBlock): boolean {
  switch (block.type) {
    case 'tableOfContents':
      return true
    case 'list':
      return block.children.some((item) => item.children.some(containsTableOfContents))
    case 'quote':
    case 'callout':
      return block.children.some(containsTableOfContents)
    default:
      return false
  }
}

function extractBlockText(block: MusubiBlock): string[] {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return [extractInlineText(block.children)]
    case 'code':
      return [block.value]
    case 'list':
      return block.children.flatMap((item) => item.children.flatMap(extractBlockText))
    case 'quote':
    case 'callout':
      return block.children.flatMap(extractBlockText)
    case 'image':
      return [block.alt, block.caption ?? '']
    case 'file':
      return [extractInlineText(block.children)]
    case 'table':
      return block.children.flatMap((row) => row.children.map(extractCellText))
    case 'xEmbed':
      return ['X']
    case 'divider':
    case 'tableOfContents':
      return []
  }
}

function extractCellText(cell: MusubiTableCell): string {
  return extractInlineText(cell.children)
}