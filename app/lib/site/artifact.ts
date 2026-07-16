import type { MusubiDocument } from '../content/types.ts'
import type { NavigationItem, PublicPageMeta, SiteConfig } from './types.ts'

export interface GeneratedPage {
  meta: PublicPageMeta
  document: MusubiDocument
}

export interface GeneratedSiteArtifact {
  schemaVersion: 1
  config: SiteConfig
  navigation: NavigationItem[]
  homePosts: PublicPageMeta[]
  blogPosts: PublicPageMeta[]
  pages: Record<string, GeneratedPage>
  routes: string[]
  generation: {
    contentRows: number
    publishedPages: number
    configRows: number
    stabilizedAssets: number
    notionApiVersion: string
  }
  fonts: unknown
}