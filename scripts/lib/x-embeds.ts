import { Buffer } from 'node:buffer'

import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5'

import {
  extractXStatusId,
  parseSafeLinkUrl,
  parseXStatusUrl,
  type MusubiBlock,
  type MusubiDocument,
  type MusubiInline,
  type MusubiXEmbed,
  type MusubiXEmbedData,
} from '../../app/lib/content/index.ts'
import { mapConcurrent } from './concurrency.ts'

const OEMBED_ENDPOINT = 'https://publish.x.com/oembed'
const OEMBED_CONCURRENCY = 2
const MAX_OEMBED_BYTES = 128 * 1024
const MAX_OEMBED_HTML_CHARACTERS = 100_000
const MAX_OEMBED_HTML_NODES = 1_000
const MAX_POST_TEXT_CHARACTERS = 20_000
const MAX_AUTHOR_CHARACTERS = 200
const MAX_DATE_LABEL_CHARACTERS = 100
const X_PROFILE_PATH = /^\/([A-Za-z\d_]{1,15})\/?$/

type HtmlChildNode = DefaultTreeAdapterTypes.ChildNode
type HtmlElement = DefaultTreeAdapterTypes.Element
type HtmlParentNode = DefaultTreeAdapterTypes.ParentNode

export interface XEmbedEnrichmentFailure {
  readonly url: string
  readonly message: string
}

export interface XEmbedEnrichmentResult {
  readonly documents: MusubiDocument[]
  readonly total: number
  readonly enriched: number
  readonly fallback: number
  readonly failures: readonly XEmbedEnrichmentFailure[]
}

export type XEmbedFetcher = (embed: MusubiXEmbed) => Promise<MusubiXEmbedData>

export async function enrichXEmbeds(
  documents: readonly MusubiDocument[],
  fetchEmbed: XEmbedFetcher = fetchXEmbedData,
): Promise<XEmbedEnrichmentResult> {
  const embeds = documents.flatMap(collectDocumentXEmbeds)
  const uniqueEmbeds = new Map(embeds.map((embed) => [embed.url, embed]))
  const resolved = new Map<string, MusubiXEmbedData>()
  const failures: XEmbedEnrichmentFailure[] = []

  await mapConcurrent(
    [...uniqueEmbeds.values()],
    OEMBED_CONCURRENCY,
    async (embed): Promise<void> => {
      try {
        resolved.set(embed.url, await fetchEmbed(embed))
      } catch (error) {
        failures.push({
          url: embed.url,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    },
  )

  const enriched = embeds.filter((embed) => resolved.has(embed.url)).length
  return {
    documents: documents.map((document) => ({
      ...document,
      children: document.children.map((block) => enrichBlock(block, resolved)),
    })),
    total: embeds.length,
    enriched,
    fallback: embeds.length - enriched,
    failures,
  }
}

export async function fetchXEmbedData(embed: MusubiXEmbed): Promise<MusubiXEmbedData> {
  const endpoint = new URL(OEMBED_ENDPOINT)
  endpoint.searchParams.set('url', embed.url)
  endpoint.searchParams.set('omit_script', 'true')
  endpoint.searchParams.set('dnt', 'true')
  endpoint.searchParams.set('hide_thread', 'true')

  const response = await fetch(endpoint, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      'user-agent': 'Musubi static X embed builder',
    },
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new Error(`X oEmbed returned HTTP ${response.status}`)
  }

  const contentLength = response.headers.get('content-length')
  if (contentLength !== null) {
    const declaredBytes = Number(contentLength)
    if (Number.isFinite(declaredBytes) && declaredBytes > MAX_OEMBED_BYTES) {
      throw new Error(`X oEmbed response exceeds ${MAX_OEMBED_BYTES} bytes`)
    }
  }
  const source = await readBoundedResponseText(response)

  let payload: unknown
  try {
    payload = JSON.parse(source)
  } catch {
    throw new Error('X oEmbed returned invalid JSON')
  }
  return parseXEmbedOEmbed(payload, embed)
}

async function readBoundedResponseText(response: Response): Promise<string> {
  if (!response.body) {
    throw new Error('X oEmbed response has no body')
  }

  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let totalBytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = Buffer.from(value)
      totalBytes += chunk.byteLength
      if (totalBytes > MAX_OEMBED_BYTES) {
        await reader.cancel().catch(() => undefined)
        throw new Error(`X oEmbed response exceeds ${MAX_OEMBED_BYTES} bytes`)
      }
      chunks.push(chunk)
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks, totalBytes).toString('utf8')
}

export function parseXEmbedOEmbed(
  payload: unknown,
  expected: Pick<MusubiXEmbed, 'url' | 'postId'>,
): MusubiXEmbedData {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('X oEmbed response is not an object')
  }
  const record = payload as Record<string, unknown>
  const context = { pageLabel: `X oEmbed ${expected.url}` }

  const responseUrl = requiredString(record, 'url', 2_048)
  const canonicalResponseUrl = parseXStatusUrl(responseUrl, context)
  const responsePostId = canonicalResponseUrl
    ? extractXStatusId(canonicalResponseUrl, context)
    : null
  if (!canonicalResponseUrl || responsePostId !== expected.postId) {
    throw new Error('X oEmbed response does not match the requested post')
  }

  const authorName = requiredString(record, 'author_name', MAX_AUTHOR_CHARACTERS)
  const author = parseAuthor(requiredString(record, 'author_url', 2_048), context)
  const html = requiredTrimmedString(record, 'html', MAX_OEMBED_HTML_CHARACTERS)
  const fragment = parseFragment(html)
  const blockquote = singleElement(fragment, 'blockquote')
  if (countNodes(blockquote) > MAX_OEMBED_HTML_NODES) {
    throw new Error(`X oEmbed HTML exceeds ${MAX_OEMBED_HTML_NODES} nodes`)
  }
  const classes = attribute(blockquote, 'class')?.split(/\s+/u) ?? []
  if (!classes.includes('twitter-tweet')) {
    throw new Error('X oEmbed HTML is missing the official twitter-tweet blockquote')
  }

  const descendants = descendantElements(blockquote)
  const unsupported = descendants.find((element) => !['a', 'br', 'p'].includes(element.tagName))
  if (unsupported) {
    throw new Error(`X oEmbed contains unsupported <${unsupported.tagName}> content`)
  }
  const paragraphs = descendants.filter((element) => element.tagName === 'p')
  if (paragraphs.length !== 1) {
    throw new Error('X oEmbed HTML must contain exactly one post paragraph')
  }
  const paragraph = paragraphs[0]!
  const content = parseInlineNodes(paragraph.childNodes, context)
  const postText = inlineText(content).trim()
  if (!postText) {
    throw new Error('X oEmbed post paragraph is empty')
  }
  if (postText.length > MAX_POST_TEXT_CHARACTERS) {
    throw new Error(`X oEmbed post text exceeds ${MAX_POST_TEXT_CHARACTERS} characters`)
  }

  const statusAnchor = descendants
    .filter((element) => element.tagName === 'a')
    .findLast((anchor) => {
      const href = attribute(anchor, 'href')
      if (!href) return false
      const canonical = parseXStatusUrl(href, context)
      return canonical ? extractXStatusId(canonical, context) === expected.postId : false
    })
  const publishedLabel = statusAnchor ? textContent(statusAnchor).trim() : ''
  if (!publishedLabel || publishedLabel.length > MAX_DATE_LABEL_CHARACTERS) {
    throw new Error('X oEmbed HTML is missing a valid publication label')
  }

  return {
    content,
    lang: canonicalLanguage(attribute(paragraph, 'lang')),
    dir: textDirection(attribute(paragraph, 'dir')),
    authorName,
    authorHandle: author.handle,
    authorUrl: author.url,
    publishedLabel,
  }
}

function collectDocumentXEmbeds(document: MusubiDocument): MusubiXEmbed[] {
  return document.children.flatMap(collectBlockXEmbeds)
}

function collectBlockXEmbeds(block: MusubiBlock): MusubiXEmbed[] {
  switch (block.type) {
    case 'xEmbed':
      return [block]
    case 'list':
      return block.children.flatMap((item) => item.children.flatMap(collectBlockXEmbeds))
    case 'quote':
    case 'callout':
      return block.children.flatMap(collectBlockXEmbeds)
    default:
      return []
  }
}

function enrichBlock(
  block: MusubiBlock,
  resolved: ReadonlyMap<string, MusubiXEmbedData>,
): MusubiBlock {
  switch (block.type) {
    case 'xEmbed':
      return { ...block, embed: resolved.get(block.url) ?? null }
    case 'list':
      return {
        ...block,
        children: block.children.map((item) => ({
          ...item,
          children: item.children.map((child) => enrichBlock(child, resolved)),
        })),
      }
    case 'quote':
    case 'callout':
      return {
        ...block,
        children: block.children.map((child) => enrichBlock(child, resolved)),
      }
    default:
      return block
  }
}

function parseAuthor(
  input: string,
  context: { readonly pageLabel: string },
): { handle: string; url: string } {
  const parsed = parseSafeLinkUrl(input, context)
  if (parsed.kind !== 'https') {
    throw new Error('X oEmbed author URL must use HTTPS')
  }
  const url = new URL(parsed.value)
  const hostname = url.hostname.toLowerCase()
  const match = url.pathname.match(X_PROFILE_PATH)
  if (
    !['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(hostname) ||
    !match ||
    url.username ||
    url.password
  ) {
    throw new Error('X oEmbed author URL is not a supported X profile')
  }
  return {
    handle: match[1]!,
    url: `https://x.com/${match[1]}`,
  }
}

function parseInlineNodes(
  nodes: readonly HtmlChildNode[],
  context: { readonly pageLabel: string },
): MusubiInline[] {
  const result: MusubiInline[] = []
  for (const node of nodes) {
    if (isTextNode(node)) {
      appendText(result, node.value)
      continue
    }
    if (!isElement(node)) {
      throw new Error(`X oEmbed contains unsupported ${node.nodeName} content`)
    }
    if (node.tagName === 'br') {
      result.push({ type: 'break' })
      continue
    }
    if (node.tagName !== 'a') {
      throw new Error(`X oEmbed contains unsupported <${node.tagName}> content`)
    }
    const href = attribute(node, 'href')
    if (!href) {
      throw new Error('X oEmbed link is missing href')
    }
    const parsed = parseSafeLinkUrl(href, context)
    if (parsed.kind !== 'http' && parsed.kind !== 'https') {
      throw new Error('X oEmbed links must use HTTP or HTTPS')
    }
    const children = parseInlineNodes(node.childNodes, context)
    if (!inlineText(children)) {
      throw new Error('X oEmbed link text is empty')
    }
    result.push({
      type: 'link',
      url: parsed.value,
      title: null,
      children,
    })
  }
  return result
}

function appendText(nodes: MusubiInline[], value: string): void {
  if (!value) return
  const previous = nodes.at(-1)
  if (previous?.type === 'text') {
    nodes[nodes.length - 1] = { ...previous, value: previous.value + value }
  } else {
    nodes.push({ type: 'text', value })
  }
}

function inlineText(nodes: readonly MusubiInline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
        case 'inlineCode':
          return node.value
        case 'break':
          return '\n'
        case 'strong':
        case 'emphasis':
        case 'delete':
        case 'link':
          return inlineText(node.children)
      }
    })
    .join('')
}

function singleElement(parent: HtmlParentNode, tagName: string): HtmlElement {
  const elements = parent.childNodes.filter(isElement)
  if (elements.length !== 1 || elements[0]!.tagName !== tagName) {
    throw new Error(`X oEmbed HTML must contain one <${tagName}> root`)
  }
  return elements[0]!
}

function descendantElements(parent: HtmlParentNode): HtmlElement[] {
  const result: HtmlElement[] = []
  const visit = (node: HtmlParentNode): void => {
    for (const child of node.childNodes) {
      if (!isElement(child)) continue
      result.push(child)
      visit(child)
    }
  }
  visit(parent)
  return result
}

function textContent(parent: HtmlParentNode): string {
  return parent.childNodes
    .map((child) => {
      if (isTextNode(child)) return child.value
      return isElement(child) ? textContent(child) : ''
    })
    .join('')
}

function countNodes(parent: HtmlParentNode): number {
  let count = 1
  for (const child of parent.childNodes) {
    count += isElement(child) ? countNodes(child) : 1
  }
  return count
}

function attribute(element: HtmlElement, name: string): string | undefined {
  return element.attrs.find((item) => item.name === name)?.value
}

function isElement(node: HtmlChildNode): node is HtmlElement {
  return 'tagName' in node
}

function isTextNode(node: HtmlChildNode): node is DefaultTreeAdapterTypes.TextNode {
  return node.nodeName === '#text'
}

function requiredString(
  record: Readonly<Record<string, unknown>>,
  key: string,
  maximumLength: number,
): string {
  const value = record[key]
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maximumLength ||
    value !== value.trim()
  ) {
    throw new Error(`X oEmbed field ${key} is missing or invalid`)
  }
  return value
}

function requiredTrimmedString(
  record: Readonly<Record<string, unknown>>,
  key: string,
  maximumLength: number,
): string {
  const value = record[key]
  if (typeof value !== 'string' || value.length > maximumLength) {
    throw new Error(`X oEmbed field ${key} is missing or invalid`)
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`X oEmbed field ${key} is missing or invalid`)
  }
  return trimmed
}

function canonicalLanguage(value: string | undefined): string | null {
  if (!value) return null
  try {
    return Intl.getCanonicalLocales(value)[0] ?? null
  } catch {
    return null
  }
}

function textDirection(value: string | undefined): 'ltr' | 'rtl' | 'auto' | null {
  return value === 'ltr' || value === 'rtl' || value === 'auto' ? value : null
}