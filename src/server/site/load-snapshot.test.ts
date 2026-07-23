import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'

import { NOTION_SNAPSHOT_SCHEMA_VERSION } from '../../shared/notion-data/types.ts'
import { loadNotionDataSnapshot } from './load-snapshot.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  )
})

describe('Notion Data snapshot loading', () => {
  it('loads page files independently in deterministic filename order', async () => {
    const root = await snapshotDirectory()
    const firstPageId = '11111111-1111-1111-1111-111111111111'
    const secondPageId = '22222222-2222-2222-2222-222222222222'
    await writeJson(join(root, 'pages', `${secondPageId}.json`), pageSnapshot(secondPageId))
    await writeJson(join(root, 'pages', `${firstPageId}.json`), pageSnapshot(firstPageId))

    const snapshot = await loadNotionDataSnapshot(root)

    expect(snapshot.configFilename).toBe(join(root, 'config.json'))
    expect(snapshot.pages.map(({ data }) => (data.page as { id: string }).id)).toEqual([
      firstPageId,
      secondPageId,
    ])
    expect(snapshot.pages.map(({ filename }) => filename)).toEqual([
      join(root, 'pages', `${firstPageId}.json`),
      join(root, 'pages', `${secondPageId}.json`),
    ])
  })

  it('fails with the offending file and both identities when filename and page.id differ', async () => {
    const root = await snapshotDirectory()
    const filenameId = '11111111-1111-1111-1111-111111111111'
    const payloadId = '22222222-2222-2222-2222-222222222222'
    const filename = join(root, 'pages', `${filenameId}.json`)
    await writeJson(filename, pageSnapshot(payloadId))

    await expect(loadNotionDataSnapshot(root)).rejects.toThrow(
      `${filename}: filename does not match page.id ${payloadId}`,
    )
  })
})

async function snapshotDirectory(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'musubi-load-snapshot-'))
  temporaryDirectories.push(root)
  await mkdir(join(root, 'pages'))
  await writeJson(join(root, 'config.json'), {
    schemaVersion: NOTION_SNAPSHOT_SCHEMA_VERSION,
    notionApiVersion: '2026-03-11',
    contentDataSource: {},
    configDataSource: {},
    configRows: [],
  })
  return root
}

async function writeJson(filename: string, value: unknown): Promise<void> {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function pageSnapshot(id: string) {
  return {
    schemaVersion: NOTION_SNAPSHOT_SCHEMA_VERSION,
    notionApiVersion: '2026-03-11',
    page: { object: 'page', id },
    markdown: {
      object: 'page_markdown',
      id,
      markdown: '',
      truncated: false,
      unknown_block_ids: [],
    },
    unknownBlocks: [],
  }
}