import type {
  PublishedPageMeta,
  RouteKind,
  RouteManifest,
  RouteManifestEntry,
  SourceContentRow,
} from './types.ts'
import { toPublicPageMeta } from './types.ts'

const topLevelReservedSlugs = new Set([
  'blog',
  '_musubi',
  '_nuxt',
  '__musubi_not_found',
  '__nuxt_error',
  '200',
  '404',
])
const invalidSlugDelimiter = /[\\/?#%]/u

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0)!
    if (codePoint <= 31 || (codePoint >= 127 && codePoint <= 159)) {
      return true
    }
  }
  return false
}

function comparisonKey(value: string): string {
  return value.normalize('NFC').toLowerCase()
}

function compareText(left: string, right: string): number {
  if (left === right) {
    return 0
  }
  return left < right ? -1 : 1
}

export function normalizeSlug(rawSlug: string, sourceLabel: string): string {
  const slug = rawSlug.trim().normalize('NFC')
  if (!slug) {
    throw new Error(`${sourceLabel}: Published content requires a nonempty Slug`)
  }
  if (slug === '.' || slug === '..') {
    throw new Error(`${sourceLabel}: Slug cannot be a dot segment`)
  }
  if (invalidSlugDelimiter.test(slug) || hasControlCharacter(slug)) {
    throw new Error(
      `${sourceLabel}: Slug must be one raw Unicode path segment without separators, controls, query/fragment delimiters, or percent encoding`,
    )
  }
  return slug
}

function validateDate(date: string | undefined, row: SourceContentRow): string | undefined {
  if (!date) {
    if (row.type === 'Post') {
      throw new Error(`${row.sourceLabel}: Published Post requires a Date`)
    }
    return undefined
  }
  if (!Number.isFinite(Date.parse(date))) {
    throw new Error(`${row.sourceLabel}: Date must be a valid ISO date or date-time`)
  }
  return date
}

function normalizePublishedRow(row: SourceContentRow): PublishedPageMeta {
  const title = row.title.trim()
  if (!title) {
    throw new Error(`${row.sourceLabel}: Published content requires a nonempty Title`)
  }
  const slug = normalizeSlug(row.slug, row.sourceLabel)
  const reserved = row.type === 'Page' ? topLevelReservedSlugs : new Set<string>()
  if (reserved.has(comparisonKey(slug))) {
    throw new Error(
      `${row.sourceLabel}: Slug ${JSON.stringify(slug)} occupies a reserved ${row.type} route namespace`,
    )
  }
  return {
    sourceLabel: row.sourceLabel,
    title,
    slug,
    route: row.type === 'Post' ? `/blog/${slug}` : `/${slug}`,
    date: validateDate(row.date, row),
    type: row.type,
    description: row.description.trim(),
    tags: [...new Set(row.tags.map((tag) => tag.trim()).filter(Boolean))].sort(compareText),
    showInNavigation: row.showInNavigation ?? false,
    navigationOrder: row.navigationOrder,
  }
}

function routeToOutputFile(route: string): string {
  return route === '/' ? 'index.html' : `${route.slice(1)}/index.html`
}

function assertNoFileCollision(entries: RouteManifestEntry[], publicFiles: string[]): void {
  const files = new Map<string, string>()
  const add = (file: string, owner: string) => {
    const normalized = file.replace(/^\/+/, '').normalize('NFC')
    const key = comparisonKey(normalized)
    for (const [existingKey, existingOwner] of files) {
      if (
        key === existingKey ||
        key.startsWith(`${existingKey}/`) ||
        existingKey.startsWith(`${key}/`)
      ) {
        throw new Error(
          `${owner} conflicts with ${existingOwner}: emitted file path ${JSON.stringify(normalized)}`,
        )
      }
    }
    files.set(key, owner)
  }

  for (const file of publicFiles) {
    add(file, `public/${file}`)
  }
  add('200.html', 'Nuxt fallback document 200.html')
  add('404.html', 'Nuxt error document 404.html')
  for (const entry of entries) {
    add(entry.outputFile, entry.sourceLabel)
  }
}

function addRoute(
  entries: RouteManifestEntry[],
  seen: Map<string, RouteManifestEntry>,
  route: string,
  kind: RouteKind,
  sourceLabel: string,
): void {
  const key = comparisonKey(route)
  const previous = seen.get(key)
  if (previous) {
    throw new Error(
      `${sourceLabel} conflicts with ${previous.sourceLabel}: duplicate case-insensitive route ${JSON.stringify(route)}`,
    )
  }
  const entry = { route, outputFile: routeToOutputFile(route), kind, sourceLabel }
  seen.set(key, entry)
  entries.push(entry)
}

export function buildRouteManifest(
  rows: SourceContentRow[],
  publicFiles: string[] = [],
): RouteManifest {
  const published = rows.filter((row) => row.status === 'Published').map(normalizePublishedRow)
  const posts = published
    .filter((page) => page.type === 'Post')
    .sort((left, right) => {
      const byDate = Date.parse(right.date!) - Date.parse(left.date!)
      return byDate || compareText(left.title, right.title) || compareText(left.slug, right.slug)
    })
  const standalonePages = published
    .filter((page) => page.type === 'Page')
    .sort(
      (left, right) => compareText(left.title, right.title) || compareText(left.slug, right.slug),
    )

  const navigation = standalonePages
    .filter((page) => page.showInNavigation)
    .sort((left, right) => {
      const leftOrdered = left.navigationOrder !== undefined
      const rightOrdered = right.navigationOrder !== undefined
      if (leftOrdered !== rightOrdered) {
        return leftOrdered ? -1 : 1
      }
      if (leftOrdered && rightOrdered && left.navigationOrder !== right.navigationOrder) {
        return left.navigationOrder! - right.navigationOrder!
      }
      return compareText(left.title, right.title) || compareText(left.slug, right.slug)
    })
    .map(({ title, route }) => ({ title, route }))

  const blogPosts = posts.map(toPublicPageMeta)
  const homePosts = blogPosts.slice(0, 5)

  const entries: RouteManifestEntry[] = []
  const seen = new Map<string, RouteManifestEntry>()
  addRoute(entries, seen, '/', 'home', 'generated recent-Post Home')
  addRoute(entries, seen, '/blog', 'blog', 'generated complete Blog archive')
  for (const post of posts) {
    addRoute(entries, seen, post.route, 'post', post.sourceLabel)
  }
  for (const page of standalonePages) {
    addRoute(entries, seen, page.route, 'page', page.sourceLabel)
  }

  assertNoFileCollision(entries, publicFiles)

  return {
    entries,
    routes: entries.map(({ route }) => route),
    posts,
    standalonePages,
    navigation,
    homePosts,
    blogPosts,
  }
}