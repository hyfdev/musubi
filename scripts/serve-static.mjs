import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

import { verifyStaticArtifact } from './verify-static-artifact.mjs'

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 4173
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const REVALIDATE_CACHE_CONTROL = 'public, max-age=0, must-revalidate'
const HASHED_NUXT_ASSET_PATTERN = /^_nuxt\/(?:[^/]+\/)*[^/]+[.-][A-Za-z0-9_-]{8,}\.[a-z0-9]+$/u
const HASHED_GENERATED_ASSET_PATTERN = /^_musubi\/generated\/assets\/[0-9a-f]{64}\.[a-z0-9]+$/iu
const HASHED_GENERATED_FONT_PATTERN = /^_musubi\/generated\/fonts\/[^/]+-[0-9a-f]{16}\.woff2$/iu

const CONTENT_TYPES = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
])

function readOption(name) {
  const inlinePrefix = `--${name}=`
  const inline = process.argv.find((argument) => argument.startsWith(inlinePrefix))

  if (inline) {
    return inline.slice(inlinePrefix.length)
  }

  const optionIndex = process.argv.indexOf(`--${name}`)
  return optionIndex === -1 ? undefined : process.argv[optionIndex + 1]
}

function isInsideArtifact(artifactRoot, filePath) {
  const pathFromRoot = relative(artifactRoot, filePath)
  return pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`)
}

async function resolveRequestFile(artifactRoot, pathname) {
  let decodedPath

  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    return undefined
  }

  if (decodedPath.includes('\\')) {
    return undefined
  }

  const segments = decodedPath.split('/').filter(Boolean)

  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return undefined
  }

  const relativePath = segments.join('/')
  const candidates = decodedPath.endsWith('/')
    ? [`${relativePath}/index.html`]
    : [relativePath, `${relativePath}.html`, `${relativePath}/index.html`]

  if (relativePath === '') {
    candidates.unshift('index.html')
  }

  for (const candidate of candidates) {
    const filePath = resolve(artifactRoot, candidate)

    if (!isInsideArtifact(artifactRoot, filePath)) {
      continue
    }

    const fileStat = await lstat(filePath).catch(() => undefined)

    if (fileStat?.isFile()) {
      return {
        filePath,
        relativePath: relative(artifactRoot, filePath).split(sep).join('/'),
        size: fileStat.size,
        mtimeMs: fileStat.mtimeMs,
      }
    }
  }

  return undefined
}

export function cacheControlForArtifactPath(relativePath) {
  const normalizedPath = relativePath.replaceAll('\\', '/').replace(/^\/+/u, '')

  if (
    HASHED_NUXT_ASSET_PATTERN.test(normalizedPath) ||
    HASHED_GENERATED_ASSET_PATTERN.test(normalizedPath) ||
    HASHED_GENERATED_FONT_PATTERN.test(normalizedPath)
  ) {
    return IMMUTABLE_CACHE_CONTROL
  }

  return REVALIDATE_CACHE_CONTROL
}

async function createEntityTag(file) {
  const content = await readFile(file.filePath)
  return `"${createHash('sha256').update(content).digest('base64url')}"`
}

function normalizeEntityTag(value) {
  return value.trim().replace(/^W\//iu, '')
}

function matchesIfNoneMatch(header, entityTag) {
  const values = Array.isArray(header) ? header : [header]
  const normalizedEntityTag = normalizeEntityTag(entityTag)

  return values.some((value) =>
    value
      .split(',')
      .map((candidate) => candidate.trim())
      .some(
        (candidate) => candidate === '*' || normalizeEntityTag(candidate) === normalizedEntityTag,
      ),
  )
}

function isNotModified(request, file, entityTag) {
  const ifNoneMatch = request.headers['if-none-match']
  if (ifNoneMatch !== undefined) {
    return matchesIfNoneMatch(ifNoneMatch, entityTag)
  }

  const ifModifiedSince = request.headers['if-modified-since']
  if (typeof ifModifiedSince !== 'string') return false
  const modifiedSince = Date.parse(ifModifiedSince)
  if (Number.isNaN(modifiedSince)) return false
  return Math.trunc(file.mtimeMs / 1000) <= Math.trunc(modifiedSince / 1000)
}

async function sendFile(request, response, file, statusCode = 200) {
  const cacheControl = cacheControlForArtifactPath(file.relativePath)
  response.statusCode = statusCode
  response.setHeader('cache-control', cacheControl)
  response.setHeader('last-modified', new Date(file.mtimeMs).toUTCString())

  if (cacheControl === REVALIDATE_CACHE_CONTROL) {
    const entityTag = await createEntityTag(file)
    response.setHeader('etag', entityTag)
    if (statusCode === 200 && isNotModified(request, file, entityTag)) {
      response.statusCode = 304
      response.end()
      return
    }
  }

  response.setHeader(
    'content-type',
    CONTENT_TYPES.get(extname(file.filePath).toLowerCase()) ?? 'application/octet-stream',
  )
  response.setHeader('content-length', String(file.size))

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  createReadStream(file.filePath).pipe(response)
}

export function createStaticArtifactServer(artifactRoot) {
  const root = resolve(artifactRoot)

  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { allow: 'GET, HEAD' }).end()
      return
    }

    try {
      const requestUrl = new URL(request.url ?? '/', 'http://localhost')
      const file = await resolveRequestFile(root, requestUrl.pathname)

      if (file) {
        await sendFile(request, response, file)
        return
      }

      const notFoundPath = resolve(root, '404.html')
      const notFoundStat = await lstat(notFoundPath)
      await sendFile(
        request,
        response,
        {
          filePath: notFoundPath,
          relativePath: '404.html',
          size: notFoundStat.size,
          mtimeMs: notFoundStat.mtimeMs,
        },
        404,
      )
    } catch (error) {
      console.error(error)
      response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      response.end('Internal Server Error')
    }
  })
}

async function main() {
  const host = readOption('host') ?? process.env.HOST ?? DEFAULT_HOST
  const rawPort = readOption('port') ?? process.env.PORT ?? String(DEFAULT_PORT)
  const port = Number(rawPort)

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid port: ${rawPort}`)
  }

  const artifact = await verifyStaticArtifact()
  const server = createStaticArtifactServer(artifact.root)

  server.on('error', (error) => {
    if ('code' in error && error.code === 'EADDRINUSE') {
      console.error(`Port ${port} on ${host} is already in use`)
    } else {
      console.error(error)
    }

    process.exitCode = 1
  })

  server.listen(port, host, () => {
    console.log(
      `Static artifact ready at http://${host}:${port} (${artifact.fileCount} files, ${artifact.totalBytes} bytes)`,
    )
  })

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit()))
  }
}

const entryUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined

if (entryUrl === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}