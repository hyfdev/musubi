import { createReadStream } from 'node:fs'
import { lstat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, relative, resolve, sep } from 'node:path'

import { verifyStaticArtifact } from './verify-static-artifact.mjs'

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 4173

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

const host = readOption('host') ?? process.env.HOST ?? DEFAULT_HOST
const rawPort = readOption('port') ?? process.env.PORT ?? String(DEFAULT_PORT)
const port = Number(rawPort)

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid port: ${rawPort}`)
}

const artifact = await verifyStaticArtifact()
const artifactRoot = artifact.root

function isInsideArtifact(filePath) {
  const pathFromRoot = relative(artifactRoot, filePath)
  return pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`)
}

async function resolveRequestFile(pathname) {
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

    if (!isInsideArtifact(filePath)) {
      continue
    }

    const fileStat = await lstat(filePath).catch(() => undefined)

    if (fileStat?.isFile()) {
      return { filePath, size: fileStat.size }
    }
  }

  return undefined
}

function sendFile(request, response, file) {
  response.statusCode = 200
  response.setHeader(
    'content-type',
    CONTENT_TYPES.get(extname(file.filePath).toLowerCase()) ?? 'application/octet-stream',
  )
  response.setHeader('content-length', String(file.size))
  response.setHeader('cache-control', 'no-store')

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  createReadStream(file.filePath).pipe(response)
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { allow: 'GET, HEAD' }).end()
    return
  }

  try {
    const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`)
    const file = await resolveRequestFile(requestUrl.pathname)

    if (file) {
      sendFile(request, response, file)
      return
    }

    const notFoundPath = resolve(artifactRoot, '404.html')
    const notFoundStat = await lstat(notFoundPath)
    response.statusCode = 404
    response.setHeader('content-type', 'text/html; charset=utf-8')
    response.setHeader('content-length', String(notFoundStat.size))
    response.setHeader('cache-control', 'no-store')

    if (request.method === 'HEAD') {
      response.end()
      return
    }

    createReadStream(notFoundPath).pipe(response)
  } catch (error) {
    console.error(error)
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Internal Server Error')
  }
})

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