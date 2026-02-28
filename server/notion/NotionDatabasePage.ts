/**
 * NotionDatabasePage
 * Represents a Notion database/collection page with methods to access child pages
 *
 * Caching: Database recordMap fetched lazily on first access, then cached.
 */

import { NotionAPI } from 'notion-client'
import { type ExtendedRecordMap } from 'notion-types'
import { readSnapshot, shouldUseSnapshot } from './snapshot'
import { consola as logger } from 'consola'

// Shared Notion client instance for efficiency
const sharedNotion = new NotionAPI()

export class NotionDatabasePage {
  private pageId: string
  private recordMapPromise?: Promise<ExtendedRecordMap>
  private notion: NotionAPI

  constructor(pageId: string) {
    this.pageId = pageId
    this.notion = sharedNotion
  }

  private async fetchRecordMapCached(): Promise<ExtendedRecordMap> {
    if (!this.recordMapPromise) {
      this.recordMapPromise = (async () => {
        logger.info(
          `[NotionDatabasePage] fetchRecordMap: pageId=${this.pageId}, useSnapshot=${shouldUseSnapshot()}`,
        )
        if (shouldUseSnapshot()) {
          const cached = await readSnapshot(this.pageId)
          if (!cached) {
            throw new Error(`Snapshot miss for page ${this.pageId}`)
          }
          logger.info(`[NotionDatabasePage] loaded from snapshot: pageId=${this.pageId}`)
          return cached
        }

        logger.info(`[NotionDatabasePage] fetching live from Notion API: pageId=${this.pageId}`)
        const recordMap = await this.notion.getPage(this.pageId, {
          fetchMissingBlocks: true,
          fetchCollections: true,
          signFileUrls: true,
        })
        logger.info(
          `[NotionDatabasePage] API response: collections=${Object.keys(recordMap.collection || {}).length}, views=${Object.keys(recordMap.collection_view || {}).length}, queries=${Object.keys(recordMap.collection_query || {}).length}`,
        )
        return recordMap
      })()
    }
    return this.recordMapPromise
  }

  /**
   * Get the page ID
   */
  getPageId(): string {
    return this.pageId
  }

  /**
   * Get array of child page IDs in this collection
   * @returns Array of page IDs
   */
  async childPageIds(): Promise<string[]> {
    const recordMap = await this.fetchRecordMapCached()
    return this.extractSubPageIds(recordMap)
  }

  /**
   * Extract child page IDs from the collection recordMap
   * Handles both newer (collection_group_results) and older (blockIds) formats
   */
  private extractSubPageIds(recordMap: ExtendedRecordMap): string[] {
    const collectionEntry = Object.entries(recordMap.collection)[0]
    const collectionViewEntry = Object.entries(recordMap.collection_view)[0]
    const collectionQuery = recordMap.collection_query

    if (!collectionEntry || !collectionViewEntry || !collectionQuery) {
      logger.warn(
        `[NotionDatabasePage] extractSubPageIds: missing data - collection=${!!collectionEntry}, collectionView=${!!collectionViewEntry}, collectionQuery=${!!collectionQuery}`,
      )
      return []
    }

    const collectionId = collectionEntry[0]
    const viewId = collectionViewEntry[0]
    logger.info(
      `[NotionDatabasePage] extractSubPageIds: collectionId=${collectionId}, viewId=${viewId}`,
    )

    const queryResults = collectionQuery[collectionId]?.[viewId]
    if (!queryResults) {
      logger.warn(
        `[NotionDatabasePage] extractSubPageIds: no query results for collectionId=${collectionId}, viewId=${viewId}`,
      )
      return []
    }

    // Try collection_group_results first (newer format)
    if (queryResults.collection_group_results?.blockIds) {
      const pageIds = queryResults.collection_group_results.blockIds
      logger.info(
        `[NotionDatabasePage] extractSubPageIds: found ${pageIds.length} page IDs (collection_group_results)`,
      )
      return pageIds
    }

    // Fallback to blockIds (older format)
    if (queryResults.blockIds) {
      logger.info(
        `[NotionDatabasePage] extractSubPageIds: found ${queryResults.blockIds.length} page IDs (blockIds)`,
      )
      return queryResults.blockIds
    }

    // Fallback: extract page IDs from block entries whose parent is this collection
    // Needed when Notion API returns `table_groups` format instead of `blockIds`
    const pageIds: string[] = []
    for (const [id, block] of Object.entries(recordMap.block)) {
      // Block structure: { value: { value: Block, role }, spaceId }
      // or { value: Block } depending on API version
      const innerBlock = (block as any)?.value?.value ?? (block as any)?.value
      if (
        innerBlock?.type === 'page' &&
        innerBlock?.parent_table === 'collection' &&
        innerBlock?.parent_id === collectionId
      ) {
        pageIds.push(id)
      }
    }
    if (pageIds.length > 0) {
      logger.info(
        `[NotionDatabasePage] extractSubPageIds: found ${pageIds.length} page IDs (block fallback)`,
      )
      return pageIds
    }

    logger.warn(`[NotionDatabasePage] extractSubPageIds: no blockIds found in query results`)
    return []
  }
}
