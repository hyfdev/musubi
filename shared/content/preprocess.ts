import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import { contentError } from './errors.ts'
import type { MarkdownSyntaxNode } from './syntax.ts'
import type { SourcePosition } from './types.ts'

interface OffsetRange {
  start: number
  end: number
}

export const MASKED_CALLOUT_OPEN_BRACE = '\uE000'
export const MASKED_CALLOUT_CLOSE_BRACE = '\uE001'

export function preprocessNotionMarkdown(markdown: string, pageLabel: string): string {
  if (
    markdown.includes(MASKED_CALLOUT_OPEN_BRACE) ||
    markdown.includes(MASKED_CALLOUT_CLOSE_BRACE)
  ) {
    contentError({
      code: 'UNSUPPORTED_SYNTAX',
      pageLabel,
      message: 'The source contains a reserved private-use character',
    })
  }
  const syntaxTree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MarkdownSyntaxNode
  const protectedRanges = collectCodeRanges(syntaxTree)
  rejectKnownUnsupportedSyntax(markdown, pageLabel, protectedRanges)
  const masked = maskCalloutTextBraces(markdown, protectedRanges)
  const withoutEmptyBlocks = rewriteNotionEmptyBlocks(masked, protectedRanges)
  return rewriteNotionVoidTags(withoutEmptyBlocks, protectedRanges)
}

export function restoreCalloutTextBraces(value: string): string {
  return value
    .replaceAll(MASKED_CALLOUT_OPEN_BRACE, '{')
    .replaceAll(MASKED_CALLOUT_CLOSE_BRACE, '}')
}

export function restoreCalloutTextBracesInSyntaxTree(root: MarkdownSyntaxNode): MarkdownSyntaxNode {
  const restore = (value: unknown): void => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      for (const item of value) restore(item)
      return
    }

    const record = value as Record<string, unknown>
    for (const [key, child] of Object.entries(record)) {
      if (typeof child === 'string') record[key] = restoreCalloutTextBraces(child)
      else restore(child)
    }
  }

  restore(root)
  return root
}

function collectCodeRanges(root: MarkdownSyntaxNode): OffsetRange[] {
  const ranges: OffsetRange[] = []
  const visit = (node: MarkdownSyntaxNode): void => {
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    if (
      (node.type === 'code' || node.type === 'inlineCode') &&
      start !== undefined &&
      end !== undefined
    ) {
      ranges.push({ start, end })
      return
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(root)
  return ranges.sort((left, right) => left.start - right.start)
}

function rejectKnownUnsupportedSyntax(
  markdown: string,
  pageLabel: string,
  protectedRanges: readonly OffsetRange[],
): void {
  let protectedIndex = 0
  for (let index = 0; index < markdown.length; index += 1) {
    while (protectedRanges[protectedIndex] && index >= protectedRanges[protectedIndex]!.end) {
      protectedIndex += 1
    }
    const protectedRange = protectedRanges[protectedIndex]
    if (protectedRange && index >= protectedRange.start && index < protectedRange.end) {
      index = protectedRange.end - 1
      continue
    }
    if (isEscaped(markdown, index)) continue

    if (markdown[index] === '$' && hasClosingDollar(markdown, index + 1, protectedRanges)) {
      unsupportedAt(markdown, index, pageLabel, 'Notion equation syntax is not accepted')
    }
    if (markdown.startsWith('[^', index) && markdown.indexOf(']', index + 2) !== -1) {
      unsupportedAt(markdown, index, pageLabel, 'Notion citation syntax is not accepted')
    }
    if (markdown[index] === ':' && /^:[\p{Letter}\p{Number}_-]+:/u.test(markdown.slice(index))) {
      unsupportedAt(markdown, index, pageLabel, 'Notion custom emoji syntax is not accepted')
    }
    if (markdown[index] === '{' && /^(?:color|toggle)\s*=/u.test(markdown.slice(index + 1))) {
      unsupportedAt(
        markdown,
        index,
        pageLabel,
        'Notion block color and toggle attributes are not accepted',
      )
    }
  }
}

function hasClosingDollar(
  source: string,
  start: number,
  protectedRanges: readonly OffsetRange[],
): boolean {
  for (let index = start; index < source.length && source[index] !== '\n'; index += 1) {
    if (protectedRanges.some((range) => index >= range.start && index < range.end)) return false
    if (source[index] === '$' && !isEscaped(source, index)) return true
  }
  return false
}

function rewriteNotionVoidTags(markdown: string, protectedRanges: readonly OffsetRange[]): string {
  return markdown.replace(/<(br|col)(?=[\s>])([^<>]*?)>/gu, (match, _name, tail, offset) => {
    const index = Number(offset)
    if (
      isEscaped(markdown, index) ||
      protectedRanges.some((range) => index >= range.start && index < range.end) ||
      String(tail).trimEnd().endsWith('/')
    ) {
      return match
    }
    return `${match.slice(0, -1).trimEnd()} />`
  })
}

function rewriteNotionEmptyBlocks(
  markdown: string,
  protectedRanges: readonly OffsetRange[],
): string {
  return markdown.replace(/<empty-block\s*\/>/gu, (match, offset) => {
    const index = Number(offset)
    if (
      isEscaped(markdown, index) ||
      protectedRanges.some((range) => index >= range.start && index < range.end)
    ) {
      return match
    }
    return ' '.repeat(match.length)
  })
}

function maskCalloutTextBraces(markdown: string, protectedRanges: readonly OffsetRange[]): string {
  const characters = markdown.split('')
  let calloutDepth = 0
  let protectedIndex = 0
  for (let index = 0; index < markdown.length; index += 1) {
    while (protectedRanges[protectedIndex] && index >= protectedRanges[protectedIndex]!.end) {
      protectedIndex += 1
    }
    const protectedRange = protectedRanges[protectedIndex]
    if (protectedRange && index >= protectedRange.start && index < protectedRange.end) {
      index = protectedRange.end - 1
      continue
    }

    if (markdown[index] === '<') {
      const end = findTagEnd(markdown, index)
      if (end !== -1) {
        const tag = markdown.slice(index, end + 1)
        if (/^<\s*\/\s*callout\s*>$/iu.test(tag)) calloutDepth = Math.max(0, calloutDepth - 1)
        else if (/^<\s*callout(?:\s|>)/iu.test(tag) && !/\/\s*>$/u.test(tag)) calloutDepth += 1
        index = end
        continue
      }
    }

    if (calloutDepth > 0 && !isEscaped(markdown, index)) {
      if (markdown[index] === '{') characters[index] = MASKED_CALLOUT_OPEN_BRACE
      else if (markdown[index] === '}') characters[index] = MASKED_CALLOUT_CLOSE_BRACE
    }
  }
  return characters.join('')
}

function findTagEnd(source: string, start: number): number {
  let quote: '"' | "'" | null = null
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index]
    if (quote) {
      if (character === quote && !isEscaped(source, index)) quote = null
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '>') return index
    else if (character === '\n') return -1
  }
  return -1
}

function isEscaped(source: string, index: number): boolean {
  let backslashes = 0
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor -= 1) {
    backslashes += 1
  }
  return backslashes % 2 === 1
}

function unsupportedAt(source: string, offset: number, pageLabel: string, message: string): never {
  return contentError({
    code: 'UNSUPPORTED_SYNTAX',
    pageLabel,
    position: positionAt(source, offset),
    message,
  })
}

function positionAt(source: string, offset: number): SourcePosition {
  const before = source.slice(0, offset)
  const lines = before.split('\n')
  const point = {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
    offset,
  }
  return { start: point, end: point }
}