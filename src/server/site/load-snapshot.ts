import { lstat, readFile, readdir } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

import { canonicalNotionId } from '../../shared/notion-data/id.ts'
import type {
  LoadedNotionPageSnapshot,
  NotionConfigSnapshot,
  NotionDataSnapshot,
  NotionPageSnapshot,
} from '../../shared/notion-data/types.ts'

export const DEFAULT_NOTION_SNAPSHOT_ROOT = resolve('.musubi/notion-data-snapshot')

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must contain a JSON object`)
  }
  return value as Record<string, unknown>
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  let source: string
  try {
    source = await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Notion Data snapshot is missing. Run: vp run notion:setup`, {
        cause: error,
      })
    }
    throw new Error(`Unable to read Notion Data file ${path}`, { cause: error })
  }
  try {
    return record(JSON.parse(source) as unknown, path)
  } catch (error) {
    throw new Error(`${path} is not valid Notion Data JSON`, { cause: error })
  }
}

function configSnapshot(value: Record<string, unknown>, filename: string): NotionConfigSnapshot {
  if (!Number.isInteger(value.schemaVersion)) {
    throw new Error(`${filename}.schemaVersion must be an integer`)
  }
  if (typeof value.notionApiVersion !== 'string') {
    throw new Error(`${filename}.notionApiVersion must be a string`)
  }
  if (!Array.isArray(value.configRows)) {
    throw new Error(`${filename}.configRows must be an array`)
  }
  return value as unknown as NotionConfigSnapshot
}

function pageSnapshot(value: Record<string, unknown>, filename: string): NotionPageSnapshot {
  if (!Number.isInteger(value.schemaVersion)) {
    throw new Error(`${filename}.schemaVersion must be an integer`)
  }
  if (typeof value.notionApiVersion !== 'string') {
    throw new Error(`${filename}.notionApiVersion must be a string`)
  }
  const page = record(value.page, `${filename}.page`)
  const markdown = record(value.markdown, `${filename}.markdown`)
  if (!Array.isArray(value.unknownBlocks)) {
    throw new Error(`${filename}.unknownBlocks must be an array`)
  }
  if (typeof page.id !== 'string') throw new Error(`${filename}.page.id must be a string`)
  if (typeof markdown.id !== 'string') throw new Error(`${filename}.markdown.id must be a string`)
  return value as unknown as NotionPageSnapshot
}

async function assertOrdinaryDirectory(path: string, missingMessage: string): Promise<void> {
  const info = await lstat(path).catch(() => undefined)
  if (!info) throw new Error(missingMessage)
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error(`${path} must be an ordinary directory`)
  }
}

async function assertOrdinaryFile(path: string, missingMessage: string): Promise<void> {
  const info = await lstat(path).catch(() => undefined)
  if (!info) throw new Error(missingMessage)
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new Error(`${path} must be an ordinary file`)
  }
}

export async function loadNotionDataSnapshot(
  root: string = DEFAULT_NOTION_SNAPSHOT_ROOT,
): Promise<NotionDataSnapshot> {
  const snapshotRoot = resolve(root)
  await assertOrdinaryDirectory(
    snapshotRoot,
    `Notion Data snapshot is missing. Run: vp run notion:setup`,
  )
  const configFilename = join(snapshotRoot, 'config.json')
  await assertOrdinaryFile(
    configFilename,
    `Notion Data snapshot is missing. Run: vp run notion:setup`,
  )
  const config = configSnapshot(await readJson(configFilename), configFilename)
  const pagesDirectory = join(snapshotRoot, 'pages')
  await assertOrdinaryDirectory(
    pagesDirectory,
    `Notion Data pages directory is missing: ${pagesDirectory}. Run: vp run notion:setup`,
  )

  const entries = (await readdir(pagesDirectory, { withFileTypes: true })).sort((left, right) =>
    left.name.localeCompare(right.name, 'en'),
  )
  const pages: LoadedNotionPageSnapshot[] = []
  const pageIds = new Set<string>()
  for (const entry of entries) {
    const filename = join(pagesDirectory, entry.name)
    if (!entry.isFile() || entry.isSymbolicLink() || !entry.name.endsWith('.json')) {
      throw new Error(`${filename} is not an ordinary Page Data JSON file`)
    }
    const filenameId = canonicalNotionId(basename(entry.name, '.json'), `${filename} filename`)
    const data = pageSnapshot(await readJson(filename), filename)
    const page = data.page as Record<string, unknown>
    const payloadId = canonicalNotionId(String(page.id), `${filename}.page.id`)
    if (filenameId !== payloadId) {
      throw new Error(`${filename}: filename does not match page.id ${payloadId}`)
    }
    if (pageIds.has(payloadId))
      throw new Error(`${filename}: duplicate Notion page ID ${payloadId}`)
    pageIds.add(payloadId)
    pages.push({ filename, data })
  }

  return { configFilename, config, pages }
}