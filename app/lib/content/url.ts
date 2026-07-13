import { contentError } from './errors.ts'
import type { SourcePosition } from './types.ts'

export interface SafeUrlContext {
  readonly pageLabel: string
  readonly position?: SourcePosition
}

export type SafeLinkUrlKind = 'http' | 'https' | 'mailto' | 'tel' | 'relative' | 'fragment'

export interface SafeLinkUrl {
  readonly value: string
  readonly kind: SafeLinkUrlKind
}

const SCHEME = /^([A-Za-z][A-Za-z\d+.-]*):/
const BASE_URL = new URL('https://musubi.invalid/')
const X_HOSTS = new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'])
const X_STATUS_PATH = /^\/(?:[A-Za-z\d_]{1,15}|i\/web)\/status\/([1-9]\d*)\/?$/
const NOTION_HOSTS = new Set([
  'notion.so',
  'www.notion.so',
  'notion.com',
  'www.notion.com',
  'app.notion.com',
])
const NOTION_ID_AT_END = /([a-f\d]{32}|[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})$/i

export function parseSafeLinkUrl(input: string, context: SafeUrlContext): SafeLinkUrl {
  assertUrlText(input, context)

  if (input.startsWith('#')) {
    if (input.length === 1) unsafeUrl(input, context)
    return { value: input, kind: 'fragment' }
  }

  if (input.startsWith('//') || input.includes('\\')) {
    unsafeUrl(input, context)
  }

  const scheme = input.match(SCHEME)?.[1]?.toLowerCase()
  if (scheme) {
    if (scheme === 'http' || scheme === 'https') {
      const url = parseAbsoluteUrl(input, context)
      if (url.username || url.password) unsafeUrl(input, context)
      return { value: input, kind: scheme }
    }

    if (scheme === 'mailto' || scheme === 'tel') {
      return { value: input, kind: scheme }
    }

    unsafeUrl(input, context)
  }

  const url = parseRelativeUrl(input, context)
  if (url.origin !== BASE_URL.origin) unsafeUrl(input, context)
  return { value: input, kind: 'relative' }
}

export function parseSafeImageUrl(input: string, context: SafeUrlContext): string {
  const parsed = parseSafeLinkUrl(input, context)
  if (!['http', 'https', 'relative'].includes(parsed.kind)) {
    unsafeUrl(input, context)
  }
  return parsed.value
}

export function parseSafeFileUrl(input: string, context: SafeUrlContext): string {
  const parsed = parseSafeLinkUrl(input, context)
  if (parsed.kind !== 'https') {
    unsafeUrl(input, context)
  }
  return parsed.value
}

export function parseXStatusUrl(input: string, context: SafeUrlContext): string | null {
  const parsed = parseSafeLinkUrl(input, context)
  if (parsed.kind !== 'https') return null

  const url = parseAbsoluteUrl(parsed.value, context)
  const hostname = url.hostname.toLowerCase()
  const match = url.pathname.match(X_STATUS_PATH)
  if (!X_HOSTS.has(hostname) || !match || url.username || url.password) {
    return null
  }

  const path = url.pathname.replace(/\/$/, '')
  return `https://x.com${path}`
}

export function extractNotionBlockIdFromUrl(input: string, context: SafeUrlContext): string | null {
  const parsed = parseSafeLinkUrl(input, context)
  if (parsed.kind !== 'https') return null

  const url = parseAbsoluteUrl(parsed.value, context)
  if (!NOTION_HOSTS.has(url.hostname.toLowerCase())) return null

  const candidates = [
    url.hash.slice(1),
    url.pathname.split('/').filter(Boolean).at(-1) ?? '',
    url.searchParams.get('p') ?? '',
  ]
  for (const candidate of candidates) {
    const id = candidate.match(NOTION_ID_AT_END)?.[1]
    if (id) return hyphenateNotionId(id.toLowerCase())
  }
  return null
}

function assertUrlText(input: string, context: SafeUrlContext): void {
  if (input.length === 0 || input !== input.trim() || hasControlCharacter(input)) {
    unsafeUrl(input, context)
  }
}

function hasControlCharacter(input: string): boolean {
  for (const character of input) {
    const codePoint = character.codePointAt(0)!
    if (codePoint <= 31 || codePoint === 127) return true
  }
  return false
}

function parseAbsoluteUrl(input: string, context: SafeUrlContext): URL {
  try {
    return new URL(input)
  } catch {
    unsafeUrl(input, context)
  }
}

function parseRelativeUrl(input: string, context: SafeUrlContext): URL {
  try {
    return new URL(input, BASE_URL)
  } catch {
    unsafeUrl(input, context)
  }
}

function unsafeUrl(input: string, context: SafeUrlContext): never {
  return contentError({
    code: 'UNSAFE_URL',
    pageLabel: context.pageLabel,
    position: context.position,
    message: `Unsafe or malformed URL ${JSON.stringify(input)}`,
  })
}

function hyphenateNotionId(value: string): string {
  const raw = value.replaceAll('-', '')
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`
}