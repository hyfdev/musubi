import { createHash } from 'node:crypto'
import { lstat, readFile, readdir } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const REQUIRED_FILES = [
  'index.html',
  '404.html',
  '_headers',
  '_void/pages/index.json',
  '_void/pages/404.json',
]
const RUNTIME_FALLBACK_SHARD_COUNT = 32
const RUNTIME_FALLBACK_MAX_SHARD_BYTES = 600_000
const HASHED_VOID_ASSET_PATTERN = /^assets\/(?:[^/]+\/)*[^/]+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/u
const REQUIRED_HEADER_BLOCKS = [
  {
    name: 'HSTS',
    value: '/*\n  Strict-Transport-Security: max-age=63072000',
  },
  {
    name: 'Void asset immutable cache',
    value: '/assets/*\n  Cache-Control: public, max-age=31536000, immutable',
  },
  {
    name: 'font immutable cache',
    value: '/_musubi/generated/fonts/*.woff2\n  Cache-Control: public, max-age=31536000, immutable',
  },
  {
    name: 'font CSS immutable cache',
    value:
      '/_musubi/generated/fonts/fonts-*.css\n  Cache-Control: public, max-age=31536000, immutable',
  },
  {
    name: 'workers.dev noindex',
    value: 'https://:version.:subdomain.workers.dev/*\n  X-Robots-Tag: noindex',
  },
]

async function readExpectedRoutes() {
  const { loadSiteFromSnapshot } = await import('../server/site/get-site.ts')
  return (await loadSiteFromSnapshot()).routes
}

function routeArtifactPath(route) {
  if (
    !route.startsWith('/') ||
    route.includes('?') ||
    route.includes('#') ||
    route.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error(`Static route manifest contains an invalid route: ${route}`)
  }

  return route === '/' ? 'index.html' : `${route.slice(1)}.html`
}

function routePageDataPath(route) {
  return route === '/' ? '_void/pages/index.json' : `_void/pages/${route.slice(1)}.json`
}

export async function verifyStaticArtifact(
  artifactRoot = resolve('dist/client'),
  { expectedRoutes } = {},
) {
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

  const routes = expectedRoutes ?? (await readExpectedRoutes())
  for (const route of routes) {
    for (const relativePath of [routeArtifactPath(route), routePageDataPath(route)]) {
      const filePath = resolve(root, relativePath)
      const fileStat = await lstat(filePath).catch(() => undefined)
      if (!fileStat?.isFile() || fileStat.size === 0) {
        const kind = relativePath.endsWith('.json') ? 'page data' : 'route'
        throw new Error(`Static artifact is missing ${kind} ${route}: ${relativePath}`)
      }
    }
  }

  const notFoundDocument = await readFile(resolve(root, '404.html'), 'utf8')
  if (!notFoundDocument.includes('Page not found') || !notFoundDocument.includes('href="/"')) {
    throw new Error('Static artifact 404.html does not contain the visible recovery page')
  }

  const indexDocument = await readFile(resolve(root, 'index.html'), 'utf8')
  const fontCssPath = indexDocument.match(
    /\/_musubi\/generated\/fonts\/fonts-[0-9a-f]{16}\.css/iu,
  )?.[0]
  if (!fontCssPath) {
    throw new Error('Static artifact does not reference a content-addressed font stylesheet')
  }
  const fontCss = await lstat(resolve(root, fontCssPath.slice(1))).catch(() => undefined)
  if (!fontCss?.isFile() || fontCss.size === 0) {
    throw new Error(`Static artifact is missing its font stylesheet: ${fontCssPath}`)
  }
  const fontCssDocument = await readFile(resolve(root, fontCssPath.slice(1)), 'utf8')
  await verifyRuntimeFallback(root, fontCssDocument)

  const headersDocument = await readFile(resolve(root, '_headers'), 'utf8')
  for (const requiredBlock of REQUIRED_HEADER_BLOCKS) {
    if (!headersDocument.includes(requiredBlock.value)) {
      throw new Error(`Static artifact _headers is missing required block: ${requiredBlock.name}`)
    }
  }
  for (const forbiddenPath of ['200.html', '__musubi_not_found', '.vite']) {
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
      const normalizedPath = relativePath.split(sep).join('/')

      if (
        (relativePath.endsWith('.js') || relativePath.endsWith('.mjs')) &&
        !relativePath.startsWith(`assets${sep}`)
      ) {
        throw new Error(`Static artifact contains unexpected browser JavaScript: ${relativePath}`)
      }
      if (normalizedPath.startsWith('assets/') && !HASHED_VOID_ASSET_PATTERN.test(normalizedPath)) {
        throw new Error(
          `Static artifact contains a non-content-addressed Void asset under immutable caching: ${normalizedPath}`,
        )
      }
      if (/\.(?:otc|otf|ttc|ttf)$/i.test(relativePath)) {
        throw new Error(`Static artifact contains an upstream font source: ${relativePath}`)
      }
      if (relativePath.startsWith(`api${sep}`)) {
        throw new Error(`Static artifact contains a forbidden public data path: ${relativePath}`)
      }
      if (/\.(?:html|json)$/iu.test(relativePath)) {
        const document = await readFile(entryPath, 'utf8')
        const unescapedDocument = document
          .replaceAll(/\\u002f/giu, '/')
          .replaceAll(/\\u005c/giu, '\\')
        if (
          unescapedDocument.includes('notion-data-snapshot') ||
          unescapedDocument.includes('"sourceLabel"') ||
          unescapedDocument.includes('"pageLabel"')
        ) {
          throw new Error(
            `Static artifact exposes an internal Notion snapshot label: ${normalizedPath}`,
          )
        }
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

async function verifyRuntimeFallback(root, fontCssDocument) {
  const manifestPath = resolve(root, '_musubi/generated/fonts/fonts-manifest.json')
  const manifestDocument = await readFile(manifestPath, 'utf8').catch(() => undefined)
  if (!manifestDocument) {
    throw new Error('Static artifact is missing its generated font manifest')
  }
  const manifest = JSON.parse(manifestDocument)
  const runtimeCount = manifest?.sources?.fallback?.runtimeCmapCodePointCount
  const sharding = manifest?.sources?.fallback?.sharding
  const shards = manifest?.artifacts?.fallbackShards
  if (
    manifest?.schemaVersion !== 6 ||
    !Number.isInteger(runtimeCount) ||
    runtimeCount <= 0 ||
    sharding?.shardCount !== RUNTIME_FALLBACK_SHARD_COUNT ||
    sharding?.maxShardBytes !== RUNTIME_FALLBACK_MAX_SHARD_BYTES
  ) {
    throw new Error('Static artifact font manifest has no complete runtime fallback coverage')
  }
  if (!Array.isArray(shards) || shards.length !== RUNTIME_FALLBACK_SHARD_COUNT) {
    throw new Error(
      `Static artifact must contain all ${RUNTIME_FALLBACK_SHARD_COUNT} runtime fallback shards`,
    )
  }

  const faceBlocks = fontCssDocument.match(/@font-face\s*\{[^}]*\}/gu) ?? []
  const declaredCodePoints = new Set()
  const declaredPaths = new Set()
  for (const shard of shards) {
    if (
      shard?.family !== 'Musubi CJK Fallback' ||
      typeof shard.path !== 'string' ||
      !shard.path.startsWith('fonts/') ||
      shard.path.includes('\\') ||
      shard.path
        .split('/')
        .some((segment) => segment === '' || segment === '.' || segment === '..') ||
      !Number.isInteger(shard.bytes) ||
      shard.bytes <= 0 ||
      shard.bytes > RUNTIME_FALLBACK_MAX_SHARD_BYTES ||
      !Number.isInteger(shard?.coverage?.count) ||
      !Array.isArray(shard?.coverage?.ranges) ||
      typeof shard?.coverage?.cssUnicodeRange !== 'string' ||
      shard.coverage.cssUnicodeRange !== shard.coverage.ranges.join(', ') ||
      !/^[0-9a-f]{64}$/u.test(shard.sha256)
    ) {
      throw new Error('Static artifact font manifest contains an invalid runtime fallback shard')
    }
    if (declaredPaths.has(shard.path)) {
      throw new Error(`Static artifact repeats runtime fallback shard: ${shard.path}`)
    }
    declaredPaths.add(shard.path)
    const shardPath = resolve(root, '_musubi/generated', shard.path)
    const file = await lstat(shardPath).catch(() => undefined)
    if (!file?.isFile() || file.size !== shard.bytes) {
      throw new Error(`Static artifact is missing runtime fallback shard: ${shard.path}`)
    }
    const bytes = await readFile(shardPath)
    if (createHash('sha256').update(bytes).digest('hex') !== shard.sha256) {
      throw new Error(`Static artifact runtime fallback hash differs: ${shard.path}`)
    }
    const shardUrl = `/_musubi/generated/${shard.path}`
    const matchingFaces = faceBlocks.filter((block) => block.includes(`url('${shardUrl}')`))
    if (matchingFaces.length !== 1) {
      throw new Error(`Static artifact font CSS omits runtime fallback shard: ${shard.path}`)
    }
    const face = matchingFaces[0]
    if (
      !face.includes("font-family: 'Musubi CJK Fallback';") ||
      !face.includes('font-style: normal;') ||
      !face.includes('font-weight: 400 500;') ||
      !face.includes(`unicode-range: ${shard.coverage.cssUnicodeRange};`)
    ) {
      throw new Error(`Static artifact font CSS misdeclares runtime fallback shard: ${shard.path}`)
    }
    let shardDeclaredCount = 0
    for (const range of shard.coverage.ranges) {
      const [start, end] = parseUnicodeRange(range)
      if (start <= 0x7f) {
        throw new Error(`Static runtime fallback exposes ASCII through ${range}`)
      }
      for (let codePoint = start; codePoint <= end; codePoint += 1) {
        if (declaredCodePoints.has(codePoint)) {
          throw new Error(
            `Static runtime fallback coverage overlaps at U+${codePoint.toString(16).toUpperCase()}`,
          )
        }
        declaredCodePoints.add(codePoint)
        shardDeclaredCount += 1
      }
    }
    if (shardDeclaredCount !== shard.coverage.count) {
      throw new Error(
        `Static runtime fallback shard declares ${shard.coverage.count} mappings but its ranges contain ${shardDeclaredCount}: ${shard.path}`,
      )
    }
  }
  if (declaredCodePoints.size !== runtimeCount) {
    throw new Error(
      `Static runtime fallback declares ${declaredCodePoints.size} mappings; expected ${runtimeCount}`,
    )
  }
}

function parseUnicodeRange(range) {
  const match = /^U\+([0-9A-F]{4,6})(?:-([0-9A-F]{4,6}))?$/u.exec(range)
  if (!match) throw new Error(`Static runtime fallback has an invalid unicode range: ${range}`)
  const start = Number.parseInt(match[1], 16)
  return [start, match[2] ? Number.parseInt(match[2], 16) : start]
}

export async function verifyNoGeneratedDeployRedirect(
  deployConfigPath = resolve('.wrangler/deploy/config.json'),
) {
  const redirect = await lstat(deployConfigPath).catch(() => undefined)
  if (redirect) {
    throw new Error(
      'Static generation created .wrangler/deploy/config.json; this would redirect Wrangler away from the repository assets-only configuration',
    )
  }
}

async function main() {
  await verifyNoGeneratedDeployRedirect()
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