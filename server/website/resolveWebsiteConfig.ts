import type { WebsiteConfig } from './types/WebsiteConfig'
import { ConfigPage } from '../musubi-notion/ConfigPage'
import { shouldUseSnapshot, readSnapshotManifest } from '../notion/snapshot'
import logger from '../../utils/logger'

let cachedPromise: Promise<WebsiteConfig> | null = null

export function resolveWebsiteConfig(): Promise<WebsiteConfig> {
  if (!cachedPromise) {
    cachedPromise = resolveWebsiteConfigUncached()
  }
  return cachedPromise
}

async function resolveWebsiteConfigUncached(): Promise<WebsiteConfig> {
  let configPageId: string

  if (shouldUseSnapshot()) {
    const manifest = await readSnapshotManifest()
    if (!manifest?.configPageId) {
      throw new Error(
        'Snapshot manifest does not contain configPageId. Run `pnpm snapshot:update` with VITE_NOTION_CONFIG_PAGE_ID set.',
      )
    }
    configPageId = manifest.configPageId
    logger.info(`[REMOTE_CONFIG] Using config from snapshot: ${configPageId}`)
  } else {
    configPageId = import.meta.env.VITE_NOTION_CONFIG_PAGE_ID
    if (!configPageId) {
      throw new Error('VITE_NOTION_CONFIG_PAGE_ID environment variable is not set')
    }
    logger.info(`[REMOTE_CONFIG] Using remote config from Notion page: ${configPageId}`)
  }

  const configPage = new ConfigPage(configPageId)
  return (await configPage.toObject()) as WebsiteConfig
}
