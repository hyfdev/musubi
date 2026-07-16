import { lstat, readFile, readdir } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const REQUIRED_FILES = ['index.html', '404.html']

export async function verifyStaticArtifact(artifactRoot = resolve('.output/public')) {
  const root = resolve(artifactRoot)
  const rootStat = await lstat(root).catch(() => undefined)

  if (!rootStat?.isDirectory()) {
    throw new Error(`Static artifact directory does not exist: ${root}`)
  }

  for (const requiredFile of REQUIRED_FILES) {
    const filePath = resolve(root, requiredFile)
    const fileStat = await lstat(filePath).catch(() => undefined)

    if (!fileStat?.isFile() || fileStat.size === 0) {
      throw new Error(`Static artifact is missing ${requiredFile}`)
    }
  }

  const notFoundDocument = await readFile(resolve(root, '404.html'), 'utf8')
  if (!notFoundDocument.includes('Page not found') || !notFoundDocument.includes('href="/"')) {
    throw new Error('Static artifact 404.html does not contain the visible recovery page')
  }
  for (const forbiddenPath of ['200.html', '__musubi_not_found']) {
    const forbidden = await lstat(resolve(root, forbiddenPath)).catch(() => undefined)
    if (forbidden) {
      throw new Error(`Static artifact retains an internal fallback path: ${forbiddenPath}`)
    }
  }

  let fileCount = 0
  let totalBytes = 0

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true })

    for (const entry of entries) {
      const entryPath = resolve(directory, entry.name)

      if (entry.isSymbolicLink()) {
        throw new Error(`Static artifact must not contain symlinks: ${relative(root, entryPath)}`)
      }

      if (entry.isDirectory()) {
        await visit(entryPath)
        continue
      }

      if (!entry.isFile()) {
        throw new Error(
          `Static artifact contains an unsupported entry: ${relative(root, entryPath)}`,
        )
      }

      const entryStat = await lstat(entryPath)
      const relativePath = relative(root, entryPath)

      if (relativePath.endsWith('.js') || relativePath.endsWith('.mjs')) {
        throw new Error(`Static artifact contains browser JavaScript: ${relativePath}`)
      }
      if (/\.(?:otc|otf|ttc|ttf)$/i.test(relativePath)) {
        throw new Error(`Static artifact contains an upstream font source: ${relativePath}`)
      }
      if (relativePath.includes('_payload') || relativePath.startsWith(`api${sep}`)) {
        throw new Error(`Static artifact contains a forbidden public data path: ${relativePath}`)
      }
      fileCount += 1
      totalBytes += entryStat.size
    }
  }

  await visit(root)

  if (fileCount === 0) {
    throw new Error(`Static artifact contains no files: ${root}`)
  }

  return { root, fileCount, totalBytes }
}

async function main() {
  const artifact = await verifyStaticArtifact()
  console.log(
    `Static artifact verified: ${artifact.fileCount} files, ${artifact.totalBytes} bytes in ${artifact.root}`,
  )
}

const entryUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined

if (entryUrl === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}