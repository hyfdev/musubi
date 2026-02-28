/**
 * NotionStandalonePage
 * Represents a single Notion page with property access methods
 *
 * Caching: RecordMap fetched lazily on first access, then cached per instance.
 */

import { NotionAPI } from 'notion-client'
import { type ExtendedRecordMap } from 'notion-types'
import { getPageProperty } from 'notion-utils'
import { readSnapshot, shouldUseSnapshot } from './snapshot'

// Shared Notion client instance for efficiency
const sharedNotion = new NotionAPI()

export class NotionStandalonePage {
  private pageId: string
  protected recordMapPromise?: Promise<ExtendedRecordMap>
  protected notion: NotionAPI

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
        return recordMap
      })()
    }
    return this.recordMapPromise
  }

  /**
   * Get a property value from the page
   * Returns union type - caller must narrow the type
   * @param propName - Name of the property to retrieve
   * @returns Property value as string, number, string[], or undefined
   */
  async getProp(propName: string) {
    const recordMap = await this.fetchRecordMapCached()
    const pageBlock = recordMap.block[this.pageId]?.value

    if (!pageBlock) {
      return undefined
    }

    const rawProperty = getPageProperty(propName, pageBlock, recordMap)

    return rawProperty
  }

  /**
   * Get property as string with validation
   * @throws Error if property is not a string
   */
  async getPropAsString(propName: string): Promise<string> {
    const value = await this.getProp(propName)
    if (typeof value !== 'string') {
      throw new Error(`Property "${propName}" is not a string, got: ${typeof value}`)
    }
    return value
  }

  /**
   * Get property as number with validation
   * @throws Error if property is not a number
   */
  async getPropAsNumber(propName: string): Promise<number> {
    const value = await this.getProp(propName)
    if (typeof value !== 'number') {
      throw new Error(`Property "${propName}" is not a number, got: ${typeof value}`)
    }
    return value
  }

  /**
   * Get property as Date with validation
   * Converts Notion timestamp (number) to Date object
   * @throws Error if property is not a number timestamp
   */
  async getPropAsDate(propName: string): Promise<Date> {
    const value = await this.getProp(propName)
    if (typeof value !== 'number') {
      throw new Error(
        `Property "${propName}" is not a date (number timestamp), got: ${typeof value}`,
      )
    }
    return new Date(value)
  }

  /**
   * Get property as string array (tags/multi_select) with validation
   * @throws Error if property is not a string array
   */
  async getPropAsTags(propName: string): Promise<string[]> {
    const value = await this.getProp(propName)

    if (!Array.isArray(value)) {
      throw new Error(`Property "${propName}" is not an array, got: ${typeof value}`)
    }
    if (!value.every((v) => typeof v === 'string')) {
      throw new Error(`Property "${propName}" array contains non-string values`)
    }
    return value
  }

  /**
   * Get the raw Notion RecordMap for advanced use cases
   */
  async getRecordMap(): Promise<ExtendedRecordMap> {
    return await this.fetchRecordMapCached()
  }

  /**
   * Get the page ID
   */
  getPageId(): string {
    return this.pageId
  }
}
