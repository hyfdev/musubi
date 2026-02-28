import { type Compressed, decompress } from 'compress-json'
import type { ExtendedRecordMap } from 'notion-types'

export function shouldUseSnapshot(): boolean {
  return import.meta.env.VITE_USE_SNAPSHOT === '1'
}

export async function readSnapshot(pageId: string): Promise<ExtendedRecordMap | null> {
  const { default: snapshotStore } = await import('virtual:snapshot-data')
  const compressed = snapshotStore[pageId] as Compressed | undefined
  if (!compressed) return null
  return decompress(compressed) as ExtendedRecordMap
}

interface SnapshotManifest {
  databasePageId: string
  configPageId?: string
}

export async function readSnapshotManifest(): Promise<SnapshotManifest | null> {
  const { default: snapshotStore } = await import('virtual:snapshot-data')
  return (snapshotStore.__manifest as SnapshotManifest) ?? null
}
