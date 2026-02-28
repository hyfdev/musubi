import { NotionDatabasePage } from '../notion/NotionDatabasePage'
import { NotionStandalonePage } from '../notion/NotionStandalonePage'

const KEY_TO_CONFIG_PATH: Record<string, string> = {
  Title: 'title',
  Description: 'description',
  Author: 'author',
  Link: 'link',
  Lang: 'lang',
  Since: 'since',
  PostsPerPage: 'postsPerPage',
  GitHub: 'socialLink.github',
  'X(Twitter)': 'socialLink.x',
}

export class ConfigPage extends NotionDatabasePage {
  async toObject(): Promise<Record<string, any>> {
    const childIds = await this.childPageIds()

    const config: Record<string, any> = {}
    const seenKeys = new Set<string>()

    for (const pageId of childIds) {
      const row = new NotionStandalonePage(pageId)

      const enable = await row.getProp('Enable')
      if (enable !== true) continue

      const key = await row.getProp('Key')
      const value = await row.getProp('Value')

      if (typeof key !== 'string' || typeof value !== 'string') continue

      const configPath = KEY_TO_CONFIG_PATH[key]
      if (!configPath) {
        console.warn(`[ConfigPage] Unknown Key select value: "${key}"`)
        continue
      }

      if (seenKeys.has(key)) {
        console.warn(`[ConfigPage] Duplicate Key: "${key}" — skipping`)
        continue
      }
      seenKeys.add(key)

      if (configPath.includes('.')) {
        const parts = configPath.split('.')
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
        config[configPath] = value
      }
    }
    return config
  }
}
