import { NotionStandalonePage } from '../notion/NotionStandalonePage'
import logger from '../../utils/logger'

export interface MusubiPageData {
  pageId: string
  title: string
  slug: string
  date: string // ISO date string (YYYY-MM-DD)
  status: 'Published' | 'Draft'
  type: 'Post' | 'Content'
  tags: string[]
  description: string
}

export class MusubiPage extends NotionStandalonePage {
  constructor(pageId: string) {
    super(pageId)
  }

  /**
   * Get the page status independently (for draft detection before full data fetch)
   * Defaults to 'Draft' if status is missing or invalid
   */
  async getStatus(): Promise<'Published' | 'Draft'> {
    const status = await this.getProp('Status')
    if (status === 'Published') return 'Published'
    return 'Draft'
  }

  /**
   * Get the page title if available (for logging purposes)
   * Returns undefined if title is missing or not a string
   */
  async getTitle(): Promise<string | undefined> {
    const title = await this.getProp('Title')
    return typeof title === 'string' ? title : undefined
  }

  async toMusubiPageData(): Promise<MusubiPageData> {
    const [title, slug, date, status, type, tags, description] = await Promise.all([
      this.getPropAsString('Title'),
      this.getPropAsString('Slug'),
      this.getPropAsDate('Date'),
      this.getPropAsString('Status'),
      this.getPropAsString('Type'),
      this.getPropAsTags('Tags'),
      this.getProp('Description').then((v) => (typeof v === 'string' ? v : '')),
    ])

    let validatedStatus: 'Published' | 'Draft' = 'Draft'
    if (status === 'Published' || status === 'Draft') {
      validatedStatus = status
    } else {
      logger.warn(
        `[MusubiPage] Invalid or missing status "${status}" for page: title="${title}", slug="${slug}", pageId="${this.getPageId()}". Defaulting to "Draft".`,
      )
    }

    if (type !== 'Post' && type !== 'Content') {
      throw new Error(`Invalid type "${type}", expected "Post" or "Content"`)
    }

    return {
      pageId: this.getPageId(),
      title,
      slug,
      date: date.toISOString().split('T')[0] as string,
      status: validatedStatus,
      type,
      tags,
      description,
    }
  }
}
