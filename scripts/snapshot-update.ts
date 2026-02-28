/**
 * Standalone Node.js script to fetch Notion data and write .notion-data-snapshot/ files.
 *
 * Usage: node --experimental-strip-types scripts/snapshot-update.ts
 *
 * Reads env vars from .env:
 *   - VITE_NOTION_DATABASE_PAGE_ID (required) — the pages database page ID
 *   - VITE_NOTION_CONFIG_PAGE_ID (optional) — the config database page ID
 *
 * Outputs:
 *   - .notion-data-snapshot/manifest.json
 *   - .notion-data-snapshot/{pageId}.json for each page (compress-json compressed)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { NotionAPI } from 'notion-client'
import { type ExtendedRecordMap } from 'notion-types'
import { compress } from 'compress-json'

const ROOT = resolve(import.meta.dirname, '..')
const SNAPSHOT_DIR = join(ROOT, '.notion-data-snapshot')

// ---------------------------------------------------------------------------
// Parse .env file for required variables
// ---------------------------------------------------------------------------
function loadEnv(): Record<string, string> {
  const envPath = join(ROOT, '.env')
  let content: string
  try {
    content = readFileSync(envPath, 'utf-8')
  } catch {
    console.error('Error: .env file not found at', envPath)
    process.exit(1)
  }

  const env: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    // Strip inline comments and surrounding quotes
    let value = trimmed
      .slice(eqIndex + 1)
      .split('#')[0]
      .trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

// ---------------------------------------------------------------------------
// Extract child page IDs from a database RecordMap
// Same logic as NotionDatabasePage.extractSubPageIds()
// ---------------------------------------------------------------------------
function extractSubPageIds(recordMap: ExtendedRecordMap): string[] {
  const collectionEntry = Object.entries(recordMap.collection)[0]
  const collectionViewEntry = Object.entries(recordMap.collection_view)[0]
  const collectionQuery = recordMap.collection_query

  if (!collectionEntry || !collectionViewEntry || !collectionQuery) {
    return []
  }

  const collectionId = collectionEntry[0]
  const viewId = collectionViewEntry[0]
  const queryResults = (collectionQuery as Record<string, Record<string, any>>)[collectionId]?.[
    viewId
  ]
  if (!queryResults) return []

  // Try collection_group_results first (newer format), then blockIds
  const fromQuery = queryResults.collection_group_results?.blockIds ?? queryResults.blockIds ?? null
  if (fromQuery) return fromQuery

  // Fallback: extract page IDs from block entries whose parent is this collection
  // Needed when Notion API returns `table_groups` format instead of `blockIds`
  const pageIds: string[] = []
  for (const [id, block] of Object.entries(recordMap.block)) {
    const innerBlock = (block as any)?.value?.value ?? (block as any)?.value
    if (
      innerBlock?.type === 'page' &&
      innerBlock?.parent_table === 'collection' &&
      innerBlock?.parent_id === collectionId
    ) {
      pageIds.push(id)
    }
  }
  return pageIds
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const env = loadEnv()
  const databasePageId = env['VITE_NOTION_DATABASE_PAGE_ID']
  if (!databasePageId) {
    console.error('Error: VITE_NOTION_DATABASE_PAGE_ID is not set in .env')
    process.exit(1)
  }

  const configPageId = env['VITE_NOTION_CONFIG_PAGE_ID']

  const notion = new NotionAPI()

  // Clean and recreate .notion-data-snapshot/
  try {
    const existing = readdirSync(SNAPSHOT_DIR)
    for (const file of existing) {
      rmSync(join(SNAPSHOT_DIR, file))
    }
  } catch {
    mkdirSync(SNAPSHOT_DIR, { recursive: true })
  }

  const allPageIds: string[] = []

  // --- Fetch pages database ---
  console.log(`Fetching pages database: ${databasePageId}`)
  const dbRecordMap = await notion.getPage(databasePageId, {
    fetchMissingBlocks: true,
    fetchCollections: true,
    signFileUrls: true,
  })
  writeCompressed(databasePageId, dbRecordMap)
  allPageIds.push(databasePageId)

  const childIds = extractSubPageIds(dbRecordMap)
  console.log(`Found ${childIds.length} child pages`)

  for (const pageId of childIds) {
    console.log(`  Fetching page: ${pageId}`)
    const recordMap = await notion.getPage(pageId, {
      fetchMissingBlocks: true,
      fetchCollections: true,
      signFileUrls: true,
    })
    writeCompressed(pageId, recordMap)
    allPageIds.push(pageId)
  }

  // --- Fetch config database (if configured) ---
  if (configPageId) {
    console.log(`Fetching config database: ${configPageId}`)
    const configRecordMap = await notion.getPage(configPageId, {
      fetchMissingBlocks: true,
      fetchCollections: true,
      signFileUrls: true,
    })
    writeCompressed(configPageId, configRecordMap)
    allPageIds.push(configPageId)

    const configChildIds = extractSubPageIds(configRecordMap)
    console.log(`Found ${configChildIds.length} config entries`)
    for (const pageId of configChildIds) {
      console.log(`  Fetching config entry: ${pageId}`)
      const recordMap = await notion.getPage(pageId, {
        fetchMissingBlocks: true,
        fetchCollections: true,
        signFileUrls: true,
      })
      writeCompressed(pageId, recordMap)
      allPageIds.push(pageId)
    }
  }

  // --- Write manifest ---
  const manifest: Record<string, string> = {
    databasePageId,
  }
  if (configPageId) {
    manifest['configPageId'] = configPageId
  }
  writeFileSync(join(SNAPSHOT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

  console.log(`\nDone! Wrote ${allPageIds.length} snapshot files + manifest.json`)
}

function writeCompressed(pageId: string, recordMap: ExtendedRecordMap) {
  const compressed = compress(recordMap)
  writeFileSync(join(SNAPSHOT_DIR, `${pageId}.json`), JSON.stringify(compressed))
}

main().catch((err) => {
  console.error('Snapshot update failed:', err)
  process.exit(1)
})
