import { NotionDatabasePage } from '../notion/NotionDatabasePage'
import { NotionStandalonePage } from '../notion/NotionStandalonePage'

export class ConfigPage extends NotionDatabasePage {
  /**
   * Parse the Name/Value database rows into a plain object
   * Values are JSON.parsed if valid, otherwise kept as raw strings
   *
   * @returns Plain object with parsed values
   * @throws Only on Notion API failure (network error, invalid page ID, etc.)
   */
  async toObject(): Promise<Record<string, any>> {
    const childIds = await this.childPageIds()

    const config: Record<string, any> = {}
    for (const pageId of childIds) {
      const row = new NotionStandalonePage(pageId)

      const enable = await row.getProp('Enable')
      if (enable !== 'Yes') continue

      const name = await row.getProp('Name')
      const value = await row.getProp('Value')

      if (typeof name === 'string' && typeof value === 'string') {
        if (name.includes('.')) {
          // Support nested config via dot notation (e.g. "seo.titleSuffix")
          const parts = name
            .split('.')
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
          const lastPart = parts.pop()!

          let curObj = config
          for (const part of parts) {
            if (!(part in curObj)) {
              curObj[part] = {}
            }
            curObj = curObj[part]
          }
          curObj[lastPart] = value
        } else {
          config[name] = value
        }
      }
    }
    return config
  }
}
