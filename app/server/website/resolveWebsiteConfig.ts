import type { WebsiteConfig } from './types/WebsiteConfig'
import { ConfigPage } from '../musubi-notion/ConfigPage'
import logger from '../../utils/logger'

let cachedPromise: Promise<WebsiteConfig> | null = null

export function resolveWebsiteConfig(): Promise<WebsiteConfig> {
  if (!cachedPromise) {
    cachedPromise = resolveWebsiteConfigUncached()
  }
  return cachedPromise
}

async function resolveWebsiteConfigUncached(): Promise<WebsiteConfig> {
  const configPageId = process.env.NOTION_CONFIG_PAGE_ID

  // If no remote config is configured, use local config
  if (!configPageId || process.env.NUXT_PREPARE) {
    const { default: localConfig } = await import('../../../website.config')
    return localConfig
  }

  logger.info(`[REMOTE_CONFIG] Using remote config from Notion page: ${configPageId}`)

  const configPage = new ConfigPage(configPageId)
  return (await configPage.toObject()) as WebsiteConfig
}
