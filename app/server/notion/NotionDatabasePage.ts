/**
 * NotionDatabasePage
 * Represents a Notion database/collection page with methods to access child pages
 *
 * Caching: Database recordMap fetched lazily on first access, then cached.
 */

import { NotionAPI } from 'notion-client'
import { type ExtendedRecordMap } from 'notion-types'
import { readSnapshot, shouldUpdateSnapshot, shouldUseSnapshot, writeSnapshot } from './snapshot'

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
        if (shouldUseSnapshot()) {
          const cached = await readSnapshot(this.pageId)
          if (!cached) {
            throw new Error(`Snapshot miss for page ${this.pageId}`)
          }
          return cached
        }

        const recordMap = await this.notion.getPage(this.pageId, {
          fetchMissingBlocks: true,
          fetchCollections: true,
          signFileUrls: true,
        })
        if (shouldUpdateSnapshot()) {
          await writeSnapshot(this.pageId, recordMap)
        }
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
    const collection = Object.values(recordMap.collection)[0]?.value
    const collectionView = Object.values(recordMap.collection_view)[0]?.value
    const collectionQuery = recordMap.collection_query

    if (!collection || !collectionView || !collectionQuery) {
      return []
    }

    const collectionId = collection.id
    const viewIds = Object.keys(collectionView ? { [collectionView.id]: true } : {})

    let pageIds: string[] = []

    if (viewIds.length > 0) {
      const viewId = viewIds[0]
      if (!viewId) return []
      const queryResults =
        collectionId && collectionQuery[collectionId]
          ? collectionQuery[collectionId][viewId]
          : undefined

      if (queryResults) {
        // Try collection_group_results first (newer format)
        if (queryResults.collection_group_results) {
          const blockIds = queryResults.collection_group_results.blockIds
          if (blockIds) {
            pageIds = blockIds
          }
        }
        // Fallback to blockIds (older format)
        else if (queryResults.blockIds) {
          pageIds = queryResults.blockIds
        }
      }
    }

    return pageIds
  }
}
