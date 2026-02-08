import { compress, decompress } from 'compress-json'
import type { ExtendedRecordMap } from 'notion-types'

// Clear snapshot directory when UPDATE_SNAPSHOT=1 (awaited before first write)
const snapshotDirCleared =
  process.env.UPDATE_SNAPSHOT === '1'
    ? import('node:fs').then(({ existsSync, rmSync }) => {
        const dir = `${process.cwd()}/.snapshot`
        if (existsSync(dir)) {
          rmSync(dir, { recursive: true })
        }
      })
    : Promise.resolve()

export function shouldUseSnapshot(): boolean {
  return process.env.USE_SNAPSHOT === '1'
}

export function shouldUpdateSnapshot(): boolean {
  return process.env.UPDATE_SNAPSHOT === '1'
}

function getSnapshotDir(): string {
  return `${process.cwd()}/.snapshot`
}

function getSnapshotPath(pageId: string): string {
  return `${getSnapshotDir()}/${pageId}.json`
}

export async function readSnapshot(pageId: string): Promise<ExtendedRecordMap | null> {
  const { existsSync, readFileSync } = await import('node:fs')
  const snapshotPath = getSnapshotPath(pageId)
  if (!existsSync(snapshotPath)) {
    return null
  }
  const content = readFileSync(snapshotPath, 'utf-8')
  return decompress(JSON.parse(content)) as ExtendedRecordMap
}

export async function writeSnapshot(pageId: string, data: ExtendedRecordMap): Promise<void> {
  await snapshotDirCleared
  const { existsSync, mkdirSync, writeFileSync } = await import('node:fs')
  const snapshotPath = getSnapshotPath(pageId)
  const dir = getSnapshotDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(snapshotPath, JSON.stringify(compress(data)))
}
