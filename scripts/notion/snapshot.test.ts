import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'

import {
  NOTION_SNAPSHOT_SCHEMA_VERSION,
  type NotionPageSnapshot,
} from '../../src/shared/notion-data/types.ts'
import type { FetchedNotionData } from './source.ts'
import { replaceNotionSnapshot, stableJson } from './snapshot.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  )
})

describe('Notion Data snapshot persistence', () => {
  it('serializes object keys deterministically without reordering arrays', () => {
    const left = {
      z: [{ second: 2, first: 1 }, 'kept'],
      a: { beta: true, alpha: false },
    }
    const right = {
      a: { alpha: false, beta: true },
      z: [{ first: 1, second: 2 }, 'kept'],
    }

    expect(stableJson(left)).toBe(stableJson(right))
    expect(stableJson(left)).toBe(
      '{\n  "a": {\n    "alpha": false,\n    "beta": true\n  },\n  "z": [\n    {\n      "first": 1,\n      "second": 2\n    },\n    "kept"\n  ]\n}\n',
    )
  })

  it('writes one file per page and removes pages absent from the next complete refresh', async () => {
    const directory = await temporaryDirectory()
    const target = join(directory, 'notion-data-snapshot')
    const firstPageId = '11111111-1111-1111-1111-111111111111'
    const removedPageId = '22222222-2222-2222-2222-222222222222'

    await replaceNotionSnapshot(
      fetchedData([
        [firstPageId, pageSnapshot(firstPageId, '# First')],
        [removedPageId, pageSnapshot(removedPageId, '# Removed')],
      ]),
      target,
    )
    await replaceNotionSnapshot(
      fetchedData([[firstPageId, pageSnapshot(firstPageId, '# Updated')]]),
      target,
    )

    expect(await readdir(join(target, 'pages'))).toEqual([`${firstPageId}.json`])
    expect(JSON.parse(await readFile(join(target, 'config.json'), 'utf8'))).toMatchObject({
      schemaVersion: NOTION_SNAPSHOT_SCHEMA_VERSION,
      notionApiVersion: '2026-03-11',
    })
    expect(
      JSON.parse(await readFile(join(target, 'pages', `${firstPageId}.json`), 'utf8')),
    ).toMatchObject({
      page: { id: firstPageId },
      markdown: { markdown: '# Updated' },
    })
  })
})

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'musubi-notion-snapshot-'))
  temporaryDirectories.push(directory)
  return directory
}

function fetchedData(pages: Iterable<readonly [string, NotionPageSnapshot]>): FetchedNotionData {
  return {
    config: {
      schemaVersion: NOTION_SNAPSHOT_SCHEMA_VERSION,
      notionApiVersion: '2026-03-11',
      contentDataSource: { object: 'data_source', id: 'content' },
      configDataSource: { object: 'data_source', id: 'config' },
      configRows: [],
    },
    pages: new Map(pages),
    reusedPages: 0,
  }
}

function pageSnapshot(id: string, markdown: string): NotionPageSnapshot {
  return {
    schemaVersion: NOTION_SNAPSHOT_SCHEMA_VERSION,
    notionApiVersion: '2026-03-11',
    page: { object: 'page', id },
    markdown: {
      object: 'page_markdown' as const,
      id,
      markdown,
      truncated: false,
      unknown_block_ids: [],
    },
    unknownBlocks: [],
  }
}