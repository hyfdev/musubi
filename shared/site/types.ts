import type { MusubiDocument } from '../content/types.ts'

export type ContentStatus = 'Draft' | 'Published'
export type ContentType = 'Post' | 'Page'

export interface SourceContentRow {
  sourceLabel: string
  title: string
  slug: string
  date?: string
  status: ContentStatus
  type: ContentType
  description: string
  tags: string[]
  showInNavigation?: boolean
  navigationOrder?: number
}

export interface SourceConfigRow {
  sourceLabel: string
  key: string
  value: string
  enabled: boolean
}

export interface SiteConfig {
  title: string
  description: string
  author: string
  link: string
  lang: string
  timezone: string
  since: number
  postsPerPage: number
  github: string
  x: string
}

export interface PublishedPageMeta {
  sourceLabel: string
  title: string
  slug: string
  route: string
  date?: string
  type: ContentType
  description: string
  tags: string[]
  showInNavigation: boolean
  navigationOrder?: number
}

export interface PublicPageMeta {
  title: string
  slug: string
  route: string
  date?: string
  type: ContentType
  description: string
  tags: string[]
}

interface CommonContent {
  sourceLabel: string
  title: string
  slug: string
  route: string
  description: string
  tags: string[]
  document: MusubiDocument
}

export interface Post extends CommonContent {
  type: 'Post'
  date: string
}

export interface Page extends CommonContent {
  type: 'Page'
  showInNavigation: boolean
  navigationOrder?: number
}

export type SiteContent = Post | Page

export interface Site {
  config: SiteConfig
  posts: Post[]
  pages: Page[]
  navigation: NavigationItem[]
  byRoute: ReadonlyMap<string, SiteContent>
  routes: string[]
}

export interface NavigationItem {
  title: string
  route: string
}

export type RouteKind = 'home' | 'blog' | 'post' | 'page'

export interface RouteManifestEntry {
  route: string
  outputFile: string
  kind: RouteKind
  sourceLabel: string
}

export interface RouteManifest {
  entries: RouteManifestEntry[]
  routes: string[]
  posts: PublishedPageMeta[]
  standalonePages: PublishedPageMeta[]
  navigation: NavigationItem[]
  homePosts: PublicPageMeta[]
  blogPosts: PublicPageMeta[]
}

export function toPublicPageMeta(page: PublishedPageMeta): PublicPageMeta {
  return {
    title: page.title,
    slug: page.slug,
    route: page.route,
    date: page.date,
    type: page.type,
    description: page.description,
    tags: page.tags,
  }
}

export function contentToPublicPageMeta(page: SiteContent): PublicPageMeta {
  return {
    title: page.title,
    slug: page.slug,
    route: page.route,
    date: page.type === 'Post' ? page.date : undefined,
    type: page.type,
    description: page.description,
    tags: page.tags,
  }
}