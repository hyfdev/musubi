/**
 * Website class (Singleton)
 * Handles fetching and managing blog data from Notion
 *
 * Use Website.getInstance() to access the shared instance.
 * Constructor is private - direct instantiation is forbidden.
 */

import { NotionDatabasePage } from '~~/app/server/notion/NotionDatabasePage'
import {
  shouldUseSnapshot,
  shouldUpdateSnapshot,
  readSnapshotManifest,
  writeSnapshotManifest,
} from '~~/app/server/notion/snapshot'
import { MusubiPage, type MusubiPageData } from '~/server/musubi-notion/MusubiPage'
import type { PostMeta } from '~~/app/server/website/types/PostMeta'
import type { Post } from '~~/app/server/website/types'
import logger from '~/utils/logger'

export class Website {
  private static instance: Website | null = null
  #databaseId: string
  #databasePage: NotionDatabasePage
  #allMusubiPagesPromise?: Promise<MusubiPage[]>
  #postPageBySlugPromise?: Promise<Map<string, MusubiPage>>
  #contentPageBySlugPromise?: Promise<Map<string, MusubiPage>>

  private constructor(databasePageId: string) {
    this.#databaseId = databasePageId
    this.#databasePage = new NotionDatabasePage(databasePageId)
  }

  // Get the singleton Website instance, so we could share cached data
  static async getInstance(): Promise<Website> {
    if (!Website.instance) {
      let databasePageId: string

      if (shouldUseSnapshot()) {
        const manifest = await readSnapshotManifest()
        if (!manifest) {
          throw new Error('Snapshot manifest not found. Run `pnpm snapshot:update` to generate it.')
        }
        databasePageId = manifest.databasePageId
      } else {
        databasePageId = process.env.NOTION_DATABASE_PAGE_ID || ''
        if (!databasePageId) {
          throw new Error('NOTION_DATABASE_PAGE_ID environment variable is not set')
        }
      }

      if (shouldUpdateSnapshot()) {
        await writeSnapshotManifest({ databasePageId })
      }

      Website.instance = new Website(databasePageId)
    }
    return Website.instance
  }

  async #fetchAllMusubiPagesCached() {
    if (!this.#allMusubiPagesPromise) {
      this.#allMusubiPagesPromise = this.#databasePage
        .childPageIds()
        .then((ids) => ids.map((id) => new MusubiPage(id)))
    }
    return this.#allMusubiPagesPromise
  }

  async #createPostBySlugMap() {
    const map = new Map<string, MusubiPage>()
    const pages = await this.#fetchAllMusubiPagesCached()
    for (const page of pages) {
      let data: MusubiPageData
      try {
        data = await page.toMusubiPageData()
      } catch (error) {
        const status = await page.getStatus()
        if (status === 'Draft') {
          const title = await page.getTitle()
          logger.info(
            `[Website] Skipping draft with missing data: title="${title ?? 'unknown'}", pageId="${page.getPageId()}"`,
          )
          continue
        }
        throw error
      }
      if (data.type === 'Post') {
        map.set(data.slug, page)
      }
    }

    return map
  }

  async #createContentPageBySlugMap() {
    const map = new Map<string, MusubiPage>()
    const pages = await this.#fetchAllMusubiPagesCached()
    for (const page of pages) {
      let data: MusubiPageData
      try {
        data = await page.toMusubiPageData()
      } catch (error) {
        const status = await page.getStatus()
        if (status === 'Draft') {
          const title = await page.getTitle()
          logger.info(
            `[Website] Skipping draft with missing data: title="${title ?? 'unknown'}", pageId="${page.getPageId()}"`,
          )
          continue
        }
        throw error
      }
      if (data.type === 'Content') {
        map.set(data.slug, page)
      }
    }
    return map
  }

  #getPostPageBySlugCached() {
    if (!this.#postPageBySlugPromise) {
      this.#postPageBySlugPromise = this.#createPostBySlugMap()
    }
    return this.#postPageBySlugPromise
  }

  #getContentPageBySlugCached() {
    if (!this.#contentPageBySlugPromise) {
      this.#contentPageBySlugPromise = this.#createContentPageBySlugMap()
    }
    return this.#contentPageBySlugPromise
  }

  /**
   * Get list of all published blog posts
   *
   * Caching: First call fetches from Notion, subsequent calls use cache.
   *
   * @returns Array of PostMeta objects sorted by date (newest first)
   * @throws Error if any page has invalid/missing required properties
   */
  async getPostMetaList(): Promise<PostMeta[]> {
    const pages = await this.#fetchAllMusubiPagesCached()
    const posts: PostMeta[] = []

    for (const page of pages) {
      let data: MusubiPageData
      try {
        data = await page.toMusubiPageData()
      } catch (error) {
        const status = await page.getStatus()
        if (status === 'Draft') {
          const title = await page.getTitle()
          logger.info(
            `[Website] Skipping draft with missing data: title="${title ?? 'unknown'}", pageId="${page.getPageId()}"`,
          )
          continue
        }
        throw error
      }

      // Skip non-posts and drafts
      if (data.type !== 'Post' || data.status === 'Draft') {
        continue
      }

      posts.push({
        pageId: data.pageId,
        title: data.title,
        slug: data.slug,
        date: data.date,
        description: '', // Not in MusubiPageData yet
        tags: data.tags,
      })
    }

    // Sort by date (newest first)
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * Get blog post by slug directly from cache
   *
   * Caching: Reuses cached page instances from getBlogPostList(), no extra API requests.
   *
   * @param slug - Post slug (e.g., my-post)
   * @returns Post with metadata and recordMap
   * @throws Error if blog post with given slug not found
   */
  async getPostBySlug(slug: string): Promise<Post> {
    const postMap = await this.#getPostPageBySlugCached()
    const page = postMap.get(slug)

    if (!page) {
      throw new Error(`Blog post with slug '${slug}' not found in Notion database`)
    }

    const data = await page.toMusubiPageData()
    const recordMap = await page.getRecordMap()

    return {
      meta: {
        pageId: data.pageId,
        title: data.title,
        slug: data.slug,
        date: data.date,
        description: '', // Not in MusubiPageData yet
        tags: data.tags,
      },
      recordMap,
    }
  }

  /**
   * Get list of all published content pages
   *
   * Caching: First call fetches from Notion, subsequent calls use cache.
   *
   * @returns Array of PostMeta objects sorted by title
   */
  async getContentPages(): Promise<PostMeta[]> {
    const pages = await this.#fetchAllMusubiPagesCached()
    const contentPages: PostMeta[] = []

    for (const page of pages) {
      let data: MusubiPageData
      try {
        data = await page.toMusubiPageData()
      } catch (error) {
        const status = await page.getStatus()
        if (status === 'Draft') {
          const title = await page.getTitle()
          logger.info(
            `[Website] Skipping draft with missing data: title="${title ?? 'unknown'}", pageId="${page.getPageId()}"`,
          )
          continue
        }
        throw error
      }

      // Skip non-content pages and drafts
      if (data.type !== 'Content' || data.status === 'Draft') {
        continue
      }

      contentPages.push({
        pageId: data.pageId,
        title: data.title,
        slug: data.slug,
        date: data.date,
        description: '',
        tags: data.tags,
      })
    }

    // Sort by title alphabetically
    return contentPages.sort((a, b) => a.title.localeCompare(b.title))
  }

  /**
   * Get a content page by slug
   *
   * @param slug - Page slug (e.g., about)
   * @returns Post with metadata and recordMap
   * @throws Error if content page with given slug not found
   */
  async getContentPageBySlug(slug: string): Promise<Post> {
    const pageMap = await this.#getContentPageBySlugCached()
    const page = pageMap.get(slug)

    if (!page) {
      throw new Error(`Content page with slug '${slug}' not found in Notion database`)
    }

    const data = await page.toMusubiPageData()
    const recordMap = await page.getRecordMap()

    return {
      meta: {
        pageId: data.pageId,
        title: data.title,
        slug: data.slug,
        date: data.date,
        description: '',
        tags: data.tags,
      },
      recordMap,
    }
  }

  /**
   * Get the main page ID
   */
  getDatabasePageId(): string {
    return this.#databaseId
  }
}
