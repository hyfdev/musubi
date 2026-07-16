import { contentError } from './errors.ts'
import { extractInlineText, HeadingRegistry } from './headings.ts'
import type { MarkdownSyntaxAttribute, MarkdownSyntaxNode } from './syntax.ts'
import type {
  MusubiBlock,
  MusubiCallout,
  MusubiCalloutRole,
  MusubiDocument,
  MusubiInline,
  MusubiList,
  MusubiListItem,
  MusubiTable,
  MusubiTableAlignment,
  MusubiTableCell,
  MusubiTableRow,
  NotionColor,
  SourcePosition,
} from './types.ts'
import {
  extractNotionBlockIdFromUrl,
  parseSafeFileUrl,
  parseSafeImageUrl,
  parseSafeLinkUrl,
  parseXStatusUrl,
} from './url.ts'

export type EmbedUrlsByBlockId = ReadonlyMap<string, string> | Readonly<Record<string, string>>

export interface NormalizeMusubiMarkdownOptions {
  readonly pageLabel: string
  readonly embedUrlsByBlockId?: EmbedUrlsByBlockId
}

interface NormalizeContext {
  readonly pageLabel: string
  readonly embedUrlsByBlockId?: EmbedUrlsByBlockId
  readonly headings: HeadingRegistry
}

const NOTION_COLORS = new Set<NotionColor>([
  'default',
  'gray',
  'brown',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'red',
  'gray_bg',
  'brown_bg',
  'orange_bg',
  'yellow_bg',
  'green_bg',
  'blue_bg',
  'purple_bg',
  'pink_bg',
  'red_bg',
])
const CODE_LANGUAGE = /^[\p{Letter}\p{Number}+.#_/-]+(?: [\p{Letter}\p{Number}+.#_/-]+)*$/u

export function normalizeMusubiMarkdown(
  root: MarkdownSyntaxNode,
  options: NormalizeMusubiMarkdownOptions,
): MusubiDocument {
  if (!options.pageLabel.trim()) {
    contentError({
      code: 'INVALID_DOCUMENT',
      pageLabel: options.pageLabel,
      message: 'A nonempty page label is required',
    })
  }
  if (root.type !== 'root') {
    contentError({
      code: 'INVALID_DOCUMENT',
      pageLabel: options.pageLabel,
      position: root.position,
      message: `Expected a Markdown root node, received ${root.type}`,
    })
  }

  const context: NormalizeContext = {
    pageLabel: options.pageLabel,
    embedUrlsByBlockId: options.embedUrlsByBlockId,
    headings: new HeadingRegistry(options.pageLabel),
  }
  const children = normalizeBlockChildren(root.children, context)
  return {
    type: 'document',
    pageLabel: options.pageLabel,
    children,
    tableOfContents: context.headings.toTableOfContents(),
    position: root.position,
  }
}

function normalizeBlockChildren(
  children: readonly MarkdownSyntaxNode[] | undefined,
  context: NormalizeContext,
): MusubiBlock[] {
  return (children ?? []).map((child) => normalizeBlock(child, context))
}

function normalizeBlock(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiBlock {
  switch (node.type) {
    case 'paragraph':
      return normalizeParagraph(node, context)
    case 'heading':
      return normalizeHeading(node, context)
    case 'list':
      return normalizeList(node, context)
    case 'code':
      return normalizeCode(node, context)
    case 'blockquote':
      return {
        type: 'quote',
        children: normalizeBlockChildren(node.children, context),
        position: node.position,
      }
    case 'thematicBreak':
      return { type: 'divider', position: node.position }
    case 'table':
      return normalizeGfmTable(node, context)
    case 'mdxJsxFlowElement':
    case 'mdxJsxTextElement':
      return normalizeExtensionBlock(node, context)
    case 'html':
      unsupported(node, context, 'Raw HTML is not accepted')
    case 'mdxFlowExpression':
    case 'mdxTextExpression':
      unsupported(node, context, 'MDX expressions are not accepted')
    default:
      unsupported(node, context)
  }
}

function normalizeParagraph(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiBlock {
  const children = node.children ?? []
  if (children.length === 1 && children[0]!.type === 'image') {
    return normalizeImage(children[0]!, node.position, context)
  }
  if (
    children.length === 1 &&
    children[0]!.type === 'mdxJsxTextElement' &&
    children[0]!.name === 'file'
  ) {
    return normalizeFile(children[0]!, context)
  }

  return {
    type: 'paragraph',
    children: normalizeInlineChildren(children, context),
    position: node.position,
  }
}

function normalizeHeading(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiBlock {
  if (![1, 2, 3, 4].includes(node.depth ?? 0)) {
    contentError({
      code: 'INVALID_HEADING',
      pageLabel: context.pageLabel,
      position: node.position,
      message: `Only heading levels 1 through 4 are accepted, received ${node.depth}`,
    })
  }

  const depth = node.depth as 1 | 2 | 3 | 4
  const children = normalizeInlineChildren(node.children, context)
  const heading = context.headings.register(depth, children, node.position)
  return {
    type: 'heading',
    depth,
    id: heading.id,
    children,
    position: node.position,
  }
}

function normalizeList(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiList {
  const items = (node.children ?? []).map((child) => {
    if (child.type !== 'listItem') {
      invalidExtension(child, context, 'A list may contain only list items')
    }
    return normalizeListItem(child, context)
  })
  const ordered = node.ordered === true
  const start = ordered ? (node.start ?? 1) : null
  if (start !== null && (!Number.isInteger(start) || start < 1)) {
    invalidExtension(node, context, 'An ordered list start must be positive')
  }

  return {
    type: 'list',
    ordered,
    start,
    children: items,
    position: node.position,
  }
}

function normalizeListItem(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiListItem {
  if (![null, undefined, true, false].includes(node.checked)) {
    invalidExtension(node, context, 'A task state must be true, false, or absent')
  }
  return {
    type: 'listItem',
    checked: node.checked ?? null,
    children: normalizeBlockChildren(node.children, context),
    position: node.position,
  }
}

function normalizeCode(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiBlock {
  const language =
    [node.lang, node.meta]
      .filter((part): part is string => Boolean(part))
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ') || null
  if (language && (language.length > 64 || !CODE_LANGUAGE.test(language))) {
    invalidExtension(node, context, 'Invalid code-fence language')
  }
  return {
    type: 'code',
    language,
    value: node.value ?? '',
    highlight: null,
    position: node.position,
  }
}

function normalizeImage(
  node: MarkdownSyntaxNode,
  position: SourcePosition | undefined,
  context: NormalizeContext,
): MusubiBlock {
  const alt = node.alt?.trim() ?? ''
  if (!alt) {
    contentError({
      code: 'INVALID_IMAGE',
      pageLabel: context.pageLabel,
      position: node.position ?? position,
      message: 'A published image must have nonempty alternative text',
    })
  }
  const src = parseSafeImageUrl(node.url ?? '', {
    pageLabel: context.pageLabel,
    position: node.position ?? position,
  })
  return {
    type: 'image',
    src,
    alt,
    caption: alt,
    title: node.title ?? null,
    position: node.position ?? position,
  }
}

function normalizeGfmTable(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiTable {
  const rows = (node.children ?? []).map((row) => {
    if (row.type !== 'tableRow') {
      invalidExtension(row, context, 'A GFM table may contain only rows')
    }
    return normalizeGfmTableRow(row, context)
  })
  validateTableShape(rows, node, context)

  const align = (node.align ?? []).map((value) => normalizeTableAlignment(value, node, context))
  return {
    type: 'table',
    fitPageWidth: false,
    headerRow: true,
    headerColumn: false,
    align,
    children: rows,
    position: node.position,
  }
}

function normalizeGfmTableRow(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiTableRow {
  return {
    type: 'tableRow',
    color: null,
    children: (node.children ?? []).map((cell) => {
      if (cell.type !== 'tableCell') {
        invalidExtension(cell, context, 'A GFM table row may contain only cells')
      }
      return {
        type: 'tableCell',
        color: null,
        children: normalizeInlineChildren(cell.children, context),
        position: cell.position,
      }
    }),
    position: node.position,
  }
}

function normalizeExtensionBlock(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiBlock {
  switch (node.name) {
    case 'callout':
      return normalizeCallout(node, context)
    case 'file':
      return normalizeFile(node, context)
    case 'table':
      return normalizeNotionTable(node, context)
    case 'table_of_contents':
      return normalizeTableOfContents(node, context)
    case 'unknown':
      return normalizeUnknown(node, context)
    default:
      unsupported(node, context, `JSX tag ${JSON.stringify(node.name)} is not allowlisted`)
  }
}

function normalizeFile(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiBlock {
  const attributes = readAttributes(node, ['src', 'color'], context)
  normalizeColor(attributes.get('color'), node, context)
  const rawSource = attributes.get('src')
  if (!rawSource) {
    contentError({
      code: 'INVALID_FILE',
      pageLabel: context.pageLabel,
      position: node.position,
      message: 'A Notion file requires a source URL',
    })
  }

  const children = node.children ?? []
  const inlineSource =
    children.length === 1 && children[0]!.type === 'paragraph' ? children[0]!.children : children
  const normalizedChildren = normalizeInlineChildren(inlineSource, context)
  const label = extractInlineText(normalizedChildren).trim()
  return {
    type: 'file',
    src: parseSafeFileUrl(rawSource, {
      pageLabel: context.pageLabel,
      position: node.position,
    }),
    children: label
      ? normalizedChildren
      : [{ type: 'text', value: 'Download file', position: node.position }],
    position: node.position,
  }
}

function normalizeCallout(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiCallout {
  const attributes = readAttributes(node, ['icon', 'color'], context)
  const icon = attributes.get('icon') ?? null
  if (icon && (/\p{Control}/u.test(icon) || icon.length > 64)) {
    invalidExtension(node, context, 'A callout icon is invalid')
  }
  const declaration = extractCalloutDeclaration(node.children ?? [])
  return {
    type: 'callout',
    role: declaration.role,
    icon,
    color: normalizeColor(attributes.get('color'), node, context),
    children: normalizeBlockChildren(declaration.children, context),
    position: node.position,
  }
}

const CALLOUT_DECLARATIONS = new Map<string, MusubiCalloutRole>([
  ['note', 'note'],
  ['type=note', 'note'],
  ['warning', 'warning'],
  ['type=warning', 'warning'],
  ['error', 'error'],
  ['type=error', 'error'],
])

function extractCalloutDeclaration(children: readonly MarkdownSyntaxNode[]): {
  role: MusubiCalloutRole
  children: readonly MarkdownSyntaxNode[]
} {
  const paragraph = children[0]
  const firstInline = paragraph?.type === 'paragraph' ? paragraph.children?.[0] : undefined
  if (!paragraph || !firstInline || firstInline.type !== 'text') {
    return { role: 'note', children }
  }

  const value = firstInline.value ?? ''
  const firstLine = value.split(/\r?\n/u, 1)[0] ?? ''
  const marker = /^[ \t]*\{([^{}\r\n]+)\}/u.exec(firstLine)
  if (!marker) return { role: 'note', children }

  const normalized = marker[1]!
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[ \t]*=[ \t]*/gu, '=')
  const role = CALLOUT_DECLARATIONS.get(normalized)
  if (!role) return { role: 'note', children }

  let remainder = value.slice(marker[0].length)
  if (remainder.startsWith('\r\n')) remainder = remainder.slice(2)
  else if (remainder.startsWith('\n')) remainder = remainder.slice(1)

  const inlineChildren = [...(paragraph.children ?? [])]
  if (remainder) inlineChildren[0] = { ...firstInline, value: remainder }
  else inlineChildren.shift()

  const nextChildren = [...children]
  if (inlineChildren.length > 0) nextChildren[0] = { ...paragraph, children: inlineChildren }
  else nextChildren.shift()
  return { role, children: nextChildren }
}

function normalizeNotionTable(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiTable {
  const attributes = readAttributes(
    node,
    ['fit-page-width', 'header-row', 'header-column'],
    context,
  )
  const elements = structuralElementChildren(node, context)
  const columnGroups = elements.filter((child) => child.name === 'colgroup')
  if (columnGroups.length > 1) {
    invalidExtension(node, context, 'A table may contain at most one colgroup')
  }
  const rowNodes = elements.filter((child) => child.name === 'tr')
  if (elements.length !== columnGroups.length + rowNodes.length) {
    invalidExtension(node, context, 'A table may contain only colgroup and tr elements')
  }
  const rows = rowNodes.map((row) => normalizeNotionTableRow(row, context))
  validateTableShape(rows, node, context)
  if (columnGroups[0]) {
    validateNotionColumnGroup(columnGroups[0], rows[0]!.children.length, context)
  }

  return {
    type: 'table',
    fitPageWidth: normalizeBooleanAttribute(
      attributes.get('fit-page-width'),
      'fit-page-width',
      node,
      context,
    ),
    headerRow: normalizeBooleanAttribute(attributes.get('header-row'), 'header-row', node, context),
    headerColumn: normalizeBooleanAttribute(
      attributes.get('header-column'),
      'header-column',
      node,
      context,
    ),
    align: rows[0]?.children.map(() => null) ?? [],
    children: rows,
    position: node.position,
  }
}

function validateNotionColumnGroup(
  node: MarkdownSyntaxNode,
  tableWidth: number,
  context: NormalizeContext,
): void {
  readAttributes(node, [], context)
  const columns = structuralChildren(node, 'col', context)
  if (columns.length !== tableWidth) {
    invalidExtension(node, context, 'A table colgroup must contain one col for every column')
  }
  for (const column of columns) {
    if ((column.children?.length ?? 0) !== 0) {
      invalidExtension(column, context, 'A table col must be empty')
    }
    const attributes = readAttributes(column, ['color'], context)
    normalizeColor(attributes.get('color'), column, context)
  }
}

function normalizeNotionTableRow(
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
): MusubiTableRow {
  const attributes = readAttributes(node, ['color'], context)
  const cells = structuralChildren(node, 'td', context).map((cell) =>
    normalizeNotionTableCell(cell, context),
  )
  return {
    type: 'tableRow',
    color: normalizeColor(attributes.get('color'), node, context),
    children: cells,
    position: node.position,
  }
}

function normalizeNotionTableCell(
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
): MusubiTableCell {
  const attributes = readAttributes(node, ['color'], context)
  const children = node.children ?? []
  const inlineSource =
    children.length === 1 && children[0]!.type === 'paragraph' ? children[0]!.children : children
  return {
    type: 'tableCell',
    color: normalizeColor(attributes.get('color'), node, context),
    children: normalizeInlineChildren(inlineSource, context),
    position: node.position,
  }
}

function normalizeTableOfContents(
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
): MusubiBlock {
  if ((node.children?.length ?? 0) !== 0) {
    invalidExtension(node, context, 'table_of_contents must be self-closing')
  }
  const attributes = readAttributes(node, ['color'], context)
  return {
    type: 'tableOfContents',
    color: normalizeColor(attributes.get('color'), node, context),
    position: node.position,
  }
}

function normalizeUnknown(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiBlock {
  if ((node.children?.length ?? 0) !== 0) {
    invalidExtension(node, context, 'unknown must be self-closing')
  }
  const attributes = readAttributes(node, ['alt', 'url'], context)
  const blockType = attributes.get('alt')
  const url = attributes.get('url')
  if (!blockType || !url) {
    invalidExtension(node, context, 'unknown requires alt and url attributes')
  }
  if (blockType !== 'embed' && blockType !== 'tweet') {
    contentError({
      code: 'UNKNOWN_REQUIRED_BLOCK',
      pageLabel: context.pageLabel,
      position: node.position,
      message: `Required Notion block ${JSON.stringify(blockType)} is unsupported`,
    })
  }

  const sourceBlockId = extractNotionBlockIdFromUrl(url, {
    pageLabel: context.pageLabel,
    position: node.position,
  })
  const providerUrl = sourceBlockId ? getEmbedUrl(context.embedUrlsByBlockId, sourceBlockId) : url
  const xUrl = providerUrl
    ? parseXStatusUrl(providerUrl, {
        pageLabel: context.pageLabel,
        position: node.position,
      })
    : null
  if (!xUrl) {
    contentError({
      code: 'UNRESOLVED_EMBED',
      pageLabel: context.pageLabel,
      position: node.position,
      message: sourceBlockId
        ? `The source adapter did not resolve Notion embed block ${sourceBlockId} (${url}) to a safe X status URL`
        : `Embed source ${url} is not a supported X status URL`,
    })
  }
  return {
    type: 'linkCard',
    provider: 'x',
    url: xUrl,
    sourceUrl: url,
    sourceBlockId,
    position: node.position,
  }
}

function getEmbedUrl(urls: EmbedUrlsByBlockId | undefined, blockId: string): string | undefined {
  if (!urls) return undefined

  const rawId = blockId.replaceAll('-', '')
  if (isReadonlyMap(urls)) {
    return urls.get(blockId) ?? urls.get(rawId)
  }
  return urls[blockId] ?? urls[rawId]
}

function isReadonlyMap(urls: EmbedUrlsByBlockId): urls is ReadonlyMap<string, string> {
  return typeof (urls as ReadonlyMap<string, string>).get === 'function'
}

function normalizeInlineChildren(
  children: readonly MarkdownSyntaxNode[] | undefined,
  context: NormalizeContext,
): MusubiInline[] {
  return (children ?? []).map((child) => normalizeInline(child, context))
}

function normalizeInline(node: MarkdownSyntaxNode, context: NormalizeContext): MusubiInline {
  switch (node.type) {
    case 'text':
      return {
        type: 'text',
        value: node.value ?? '',
        position: node.position,
      }
    case 'strong':
    case 'emphasis':
    case 'delete':
      return {
        type: node.type,
        children: normalizeInlineChildren(node.children, context),
        position: node.position,
      }
    case 'inlineCode':
      return {
        type: 'inlineCode',
        value: node.value ?? '',
        position: node.position,
      }
    case 'break':
      return { type: 'break', position: node.position }
    case 'mdxJsxTextElement':
      if (node.name === 'br') {
        readAttributes(node, [], context)
        if ((node.children?.length ?? 0) !== 0) {
          invalidExtension(node, context, 'br must be empty')
        }
        return { type: 'break', position: node.position }
      }
      unsupported(node, context, `Inline JSX tag ${JSON.stringify(node.name)} is not allowlisted`)
    case 'link': {
      const url = parseSafeLinkUrl(node.url ?? '', {
        pageLabel: context.pageLabel,
        position: node.position,
      }).value
      return {
        type: 'link',
        url,
        title: node.title ?? null,
        children: normalizeInlineChildren(node.children, context),
        position: node.position,
      }
    }
    case 'image':
      unsupported(node, context, 'An image must be the only content in its Markdown paragraph')
    case 'html':
      unsupported(node, context, 'Raw inline HTML is not accepted')
    case 'mdxTextExpression':
    case 'mdxFlowExpression':
      unsupported(node, context, 'MDX expressions are not accepted')
    case 'mdxJsxFlowElement':
      unsupported(node, context, `Inline JSX tag ${JSON.stringify(node.name)} is not allowlisted`)
    default:
      unsupported(node, context)
  }
}

function structuralChildren(
  node: MarkdownSyntaxNode,
  expectedName: 'tr' | 'td' | 'col',
  context: NormalizeContext,
): MarkdownSyntaxNode[] {
  const result: MarkdownSyntaxNode[] = []
  for (const child of node.children ?? []) {
    if (isNamedElement(child, expectedName)) {
      result.push(child)
      continue
    }
    if (isWhitespaceText(child)) {
      continue
    }
    if (child.type === 'paragraph' && (child.children?.length ?? 0) > 0) {
      for (const nested of child.children!) {
        if (isWhitespaceText(nested)) continue
        if (!isNamedElement(nested, expectedName)) {
          invalidExtension(
            nested,
            context,
            `${node.name} may contain only ${expectedName} elements`,
          )
        }
        result.push(nested)
      }
      continue
    }
    invalidExtension(child, context, `${node.name} may contain only ${expectedName} elements`)
  }
  return result
}

function structuralElementChildren(
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
): MarkdownSyntaxNode[] {
  const result: MarkdownSyntaxNode[] = []
  for (const child of node.children ?? []) {
    if (isNamedElement(child, child.name ?? '')) {
      result.push(child)
      continue
    }
    if (isWhitespaceText(child)) continue
    if (child.type === 'paragraph' && (child.children?.length ?? 0) > 0) {
      for (const nested of child.children!) {
        if (isWhitespaceText(nested)) continue
        if (!isNamedElement(nested, nested.name ?? '')) {
          invalidExtension(nested, context, `${node.name} may contain only named elements`)
        }
        result.push(nested)
      }
      continue
    }
    invalidExtension(child, context, `${node.name} may contain only named elements`)
  }
  return result
}

function isWhitespaceText(node: MarkdownSyntaxNode): boolean {
  return node.type === 'text' && (node.value ?? '').trim() === ''
}

function isNamedElement(node: MarkdownSyntaxNode, name: string): boolean {
  return ['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(node.type) && node.name === name
}

function readAttributes(
  node: MarkdownSyntaxNode,
  allowlist: readonly string[],
  context: NormalizeContext,
): Map<string, string> {
  const result = new Map<string, string>()
  for (const attribute of node.attributes ?? []) {
    const [name, value] = readAttribute(attribute, node, context)
    if (!allowlist.includes(name)) {
      invalidExtension(
        node,
        context,
        `Attribute ${JSON.stringify(name)} is not allowed on ${node.name}`,
      )
    }
    if (result.has(name)) {
      invalidExtension(
        node,
        context,
        `Attribute ${JSON.stringify(name)} is duplicated on ${node.name}`,
      )
    }
    result.set(name, value)
  }
  return result
}

function readAttribute(
  attribute: MarkdownSyntaxAttribute,
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
): readonly [string, string] {
  if (
    attribute.type !== 'mdxJsxAttribute' ||
    !attribute.name ||
    typeof attribute.value !== 'string'
  ) {
    invalidExtension(node, context, `Only literal string attributes are accepted on ${node.name}`)
  }
  return [attribute.name, attribute.value]
}

function normalizeColor(
  value: string | undefined,
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
): NotionColor | null {
  if (value === undefined) return null
  if (!NOTION_COLORS.has(value as NotionColor)) {
    invalidExtension(node, context, `Unknown Notion color ${JSON.stringify(value)}`)
  }
  return value as NotionColor
}

function normalizeBooleanAttribute(
  value: string | undefined,
  name: string,
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
): boolean {
  if (value === undefined || value === 'false') return false
  if (value === 'true') return true
  invalidExtension(node, context, `Attribute ${name} must be "true" or "false"`)
}

function normalizeTableAlignment(
  value: string | null,
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
): MusubiTableAlignment {
  if (value === null || ['left', 'center', 'right'].includes(value)) {
    return value as MusubiTableAlignment
  }
  invalidExtension(node, context, `Unknown table alignment ${value}`)
}

function validateTableShape(
  rows: readonly MusubiTableRow[],
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
): void {
  const width = rows[0]?.children.length ?? 0
  if (rows.length === 0 || width === 0) {
    invalidExtension(node, context, 'A table must contain at least one cell')
  }
  if (rows.some((row) => row.children.length !== width)) {
    invalidExtension(node, context, 'Every table row must have the same width')
  }
}

function unsupported(
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
  message = `Markdown node ${JSON.stringify(node.type)} is not accepted`,
): never {
  return contentError({
    code: 'UNSUPPORTED_SYNTAX',
    pageLabel: context.pageLabel,
    position: node.position,
    message,
  })
}

function invalidExtension(
  node: MarkdownSyntaxNode,
  context: NormalizeContext,
  message: string,
): never {
  return contentError({
    code: 'INVALID_EXTENSION',
    pageLabel: context.pageLabel,
    position: node.position,
    message,
  })
}