import { lstat, readdir } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

import { createSite } from '../../shared/site/create.ts'
import type { Site } from '../../shared/site/types.ts'
import { DEFAULT_NOTION_SNAPSHOT_ROOT, loadNotionDataSnapshot } from './load-snapshot.ts'

let productionSite: Promise<Site> | undefined
let developmentSite: { fingerprint: string; value: Promise<Site> } | undefined

async function listPublicFiles(root = resolve('public')): Promise<string[]> {
  const files: string[] = []
  const visit = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      const path = join(directory, entry.name)
      if (directory === root && entry.name === '_musubi') continue
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) files.push(relative(root, path).replaceAll('\\', '/'))
    }
  }
  await visit(root)
  return files.sort()
}

async function snapshotFingerprint(root = DEFAULT_NOTION_SNAPSHOT_ROOT): Promise<string> {
  const paths = [join(root, 'config.json')]
  const pagesDirectory = join(root, 'pages')
  const entries = await readdir(pagesDirectory, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    paths.push(join(pagesDirectory, entry.name))
  }
  const details = await Promise.all(
    paths.sort().map(async (path) => {
      const info = await lstat(path)
      const kind = info.isFile()
        ? 'file'
        : info.isDirectory()
          ? 'directory'
          : info.isSymbolicLink()
            ? 'symlink'
            : 'other'
      return `${path}:${kind}:${info.size}:${info.mtimeMs}`
    }),
  )
  return details.join('|')
}

export async function loadSiteFromSnapshot(
  root: string = DEFAULT_NOTION_SNAPSHOT_ROOT,
): Promise<Site> {
  const [snapshot, publicFiles] = await Promise.all([
    loadNotionDataSnapshot(root),
    listPublicFiles(),
  ])
  return createSite(snapshot, publicFiles)
}

export async function getSite(): Promise<Site> {
  if (process.env.NODE_ENV !== 'development') {
    productionSite ??= loadSiteFromSnapshot()
    return productionSite
  }

  const fingerprint = await snapshotFingerprint()
  if (!developmentSite || developmentSite.fingerprint !== fingerprint) {
    developmentSite = { fingerprint, value: loadSiteFromSnapshot() }
  }
  return developmentSite.value
}