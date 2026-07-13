import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type { GeneratedSiteArtifact } from '../../app/lib/site/artifact.ts'

let preparedSite: Promise<GeneratedSiteArtifact> | undefined

async function readPreparedSite(): Promise<GeneratedSiteArtifact> {
  const artifactPath = resolve('.musubi/site.json')
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8')) as GeneratedSiteArtifact
  if (artifact.schemaVersion !== 1 || !Array.isArray(artifact.routes)) {
    throw new Error(`Invalid prepared Musubi artifact: ${artifactPath}`)
  }
  return artifact
}

export function getPreparedSite(): Promise<GeneratedSiteArtifact> {
  preparedSite ??= readPreparedSite()
  return preparedSite
}