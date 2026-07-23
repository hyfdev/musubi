import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import type { FetchedNotionData } from './source.ts'
import type {
  NotionConfigSnapshot,
  NotionPageSnapshot,
} from '../../src/shared/notion-data/types.ts'

export const NOTION_SNAPSHOT_ROOT = resolve('.musubi/notion-data-snapshot')

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right, 'en'))
      .map(([key, child]) => [key, stableValue(child)]),
  )
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`
}

async function readJson(path: string): Promise<unknown> {
  const source = await readFile(path, 'utf8')
  return JSON.parse(source) as unknown
}

export async function readPreviousPages(
  root: string = NOTION_SNAPSHOT_ROOT,
): Promise<Map<string, NotionPageSnapshot>> {
  try {
    const config = (await readJson(join(root, 'config.json'))) as NotionConfigSnapshot
    if (!Number.isInteger(config.schemaVersion) || typeof config.notionApiVersion !== 'string') {
      return new Map()
    }
    const pagesDirectory = join(root, 'pages')
    const entries = await readdir(pagesDirectory, { withFileTypes: true })
    const pages = new Map<string, NotionPageSnapshot>()
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) return new Map()
      const page = (await readJson(join(pagesDirectory, entry.name))) as NotionPageSnapshot
      if (!page.page || typeof page.page !== 'object' || Array.isArray(page.page)) return new Map()
      const id = (page.page as Record<string, unknown>).id
      if (typeof id !== 'string') return new Map()
      pages.set(id, page)
    }
    return pages
  } catch {
    return new Map()
  }
}

async function writeSnapshotDirectory(root: string, data: FetchedNotionData): Promise<void> {
  const pagesDirectory = join(root, 'pages')
  await mkdir(pagesDirectory, { recursive: true })
  await writeFile(join(root, 'config.json'), stableJson(data.config), 'utf8')
  for (const [pageId, page] of [...data.pages].sort(([left], [right]) =>
    left.localeCompare(right, 'en'),
  )) {
    await writeFile(join(pagesDirectory, `${pageId}.json`), stableJson(page), 'utf8')
  }
}

export async function replaceNotionSnapshot(
  data: FetchedNotionData,
  target: string = NOTION_SNAPSHOT_ROOT,
): Promise<void> {
  const root = resolve(target)
  const parent = resolve(root, '..')
  const staging = join(parent, `.notion-data-snapshot.${process.pid}.tmp`)
  const backup = join(parent, `.notion-data-snapshot.${process.pid}.backup`)
  await mkdir(parent, { recursive: true })
  await rm(staging, { recursive: true, force: true })
  await rm(backup, { recursive: true, force: true })
  try {
    await writeSnapshotDirectory(staging, data)
    const current = await lstat(root).catch(() => undefined)
    if (current && (!current.isDirectory() || current.isSymbolicLink())) {
      throw new Error(`${root} must be an ordinary directory`)
    }
    if (current) await rename(root, backup)
    try {
      await rename(staging, root)
    } catch (error) {
      if (current) await rename(backup, root).catch(() => undefined)
      throw error
    }
    await rm(backup, { recursive: true, force: true })
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}