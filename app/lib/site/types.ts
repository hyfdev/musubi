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