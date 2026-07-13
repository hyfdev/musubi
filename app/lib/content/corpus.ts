import { extractInlineText } from './headings.ts'
import type { MusubiBlock, MusubiDocument, MusubiTableCell } from './types.ts'

export function extractTextFromAst(document: MusubiDocument): string {
  return document.children.flatMap(extractBlockText).filter(Boolean).join('\n')
}

export const extractCorpusText = extractTextFromAst

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
    case 'linkCard':
      return ['X']
    case 'divider':
    case 'tableOfContents':
      return []
  }
}

function extractCellText(cell: MusubiTableCell): string {
  return extractInlineText(cell.children)
}