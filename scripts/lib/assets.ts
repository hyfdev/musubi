import { createHash } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { mkdir, writeFile } from 'node:fs/promises'
import type { IncomingHttpHeaders } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { BlockList } from 'node:net'
import { posix, resolve } from 'node:path'

import type {
  MusubiBlock,
  MusubiDocument,
  MusubiFile,
  MusubiImage,
  MusubiListItem,
} from '../../app/lib/content/index.ts'
import { mapConcurrent } from './concurrency.ts'

const MAX_ASSET_BYTES = 25 * 1024 * 1024
const MAX_REDIRECTS = 5
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const CONTENT_TYPE_EXTENSIONS = new Map([
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/svg+xml', 'svg'],
  ['image/webp', 'webp'],
])
const URL_EXTENSIONS = new Set(CONTENT_TYPE_EXTENSIONS.values())
const NON_PUBLIC_IPV4 = new BlockList()
const NON_PUBLIC_IPV6 = new BlockList()

for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  NON_PUBLIC_IPV4.addSubnet(network, prefix, 'ipv4')
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['::ffff:0:0', 96],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  NON_PUBLIC_IPV6.addSubnet(network, prefix, 'ipv6')
}

export interface StabilizedAssets {
  documents: MusubiDocument[]
  files: Array<{ publicPath: string; sha256: string; bytes: number }>
}

interface DownloadedAsset {
  publicPath: string
  sha256: string
  bytes: number
}

type AssetKind = 'image' | 'file'

interface PublicAddress {
  address: string
  family: 4 | 6
}

interface PinnedAssetResponse {
  status: number
  headers: IncomingHttpHeaders
  bytes: Buffer
  finalUrl: URL
}

function extensionFromUrl(url: URL): string | undefined {
  const candidate = posix.extname(url.pathname).slice(1).toLowerCase()
  return URL_EXTENSIONS.has(candidate) ? candidate : undefined
}

async function resolvePublicAssetTarget(url: URL): Promise<PublicAddress[]> {
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443')
  ) {
    throw new Error(`Remote assets require an unauthenticated public HTTPS URL`)
  }

  const hostname = url.hostname
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/u, '')
    .toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    (!hostname.includes('.') && !hostname.includes(':'))
  ) {
    throw new Error(`Remote asset host ${hostname} is not public`)
  }

  const addresses = (await lookup(hostname, {
    all: true,
    verbatim: true,
  })) as PublicAddress[]
  if (addresses.length === 0) {
    throw new Error(`Remote asset host ${hostname} did not resolve`)
  }
  for (const address of addresses) {
    const blocked =
      address.family === 4
        ? NON_PUBLIC_IPV4.check(address.address, 'ipv4')
        : NON_PUBLIC_IPV6.check(address.address, 'ipv6')
    if (blocked) {
      throw new Error(`Remote asset host ${hostname} resolves to a non-public address`)
    }
  }
  return addresses.sort((left, right) => left.family - right.family)
}

function firstHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name]
  return Array.isArray(value) ? value[0] : value
}

async function requestPinnedAsset(url: URL, address: PublicAddress): Promise<PinnedAssetResponse> {
  const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/u, '')
  return new Promise((resolveRequest, rejectRequest) => {
    let settled = false
    const fail = (error: Error): void => {
      if (settled) return
      settled = true
      rejectRequest(error)
    }
    const request = httpsRequest(
      {
        protocol: 'https:',
        hostname: address.address,
        family: address.family,
        port: 443,
        method: 'GET',
        path: `${url.pathname}${url.search}`,
        servername: hostname,
        headers: {
          host: url.host,
          'user-agent': 'Musubi static asset builder',
        },
        signal: AbortSignal.timeout(30_000),
      },
      (response) => {
        const status = response.statusCode ?? 0
        if (REDIRECT_STATUSES.has(status) || status < 200 || status >= 300) {
          response.resume()
          settled = true
          resolveRequest({
            status,
            headers: response.headers,
            bytes: Buffer.alloc(0),
            finalUrl: url,
          })
          return
        }

        const declaredBytes = Number(firstHeader(response.headers, 'content-length'))
        if (Number.isFinite(declaredBytes) && declaredBytes > MAX_ASSET_BYTES) {
          response.destroy(new Error(`Remote asset exceeds the byte limit`))
          return
        }

        const chunks: Buffer[] = []
        let totalBytes = 0
        response.on('data', (chunk: Buffer | Uint8Array) => {
          const buffer = Buffer.from(chunk)
          totalBytes += buffer.byteLength
          if (totalBytes > MAX_ASSET_BYTES) {
            response.destroy(new Error(`Remote asset exceeds the byte limit`))
            return
          }
          chunks.push(buffer)
        })
        response.on('error', fail)
        response.on('end', () => {
          if (settled) return
          settled = true
          resolveRequest({
            status,
            headers: response.headers,
            bytes: Buffer.concat(chunks, totalBytes),
            finalUrl: url,
          })
        })
      },
    )
    request.on('error', fail)
    request.end()
  })
}

async function fetchPublicAsset(initialUrl: URL): Promise<PinnedAssetResponse> {
  let currentUrl = initialUrl
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const addresses = await resolvePublicAssetTarget(currentUrl)
    let response: PinnedAssetResponse | undefined
    let lastError: unknown
    for (const address of addresses) {
      try {
        response = await requestPinnedAsset(currentUrl, address)
        break
      } catch (error) {
        lastError = error
      }
    }
    if (!response) {
      throw new Error(`Remote asset could not be reached at a validated public address`, {
        cause: lastError,
      })
    }
    if (!REDIRECT_STATUSES.has(response.status)) {
      return response
    }

    const location = firstHeader(response.headers, 'location')
    if (!location) {
      throw new Error(`Remote asset redirect did not provide a destination`)
    }
    currentUrl = new URL(location, currentUrl)
  }
  throw new Error(`Remote asset exceeded ${MAX_REDIRECTS} redirects`)
}

async function downloadAsset(
  sourceUrl: string,
  generatedPublicRoot: string,
  kind: AssetKind,
): Promise<DownloadedAsset> {
  const url = new URL(sourceUrl)
  const sourceLabel = `${url.origin}${url.pathname}`
  const assetLabel = kind === 'image' ? 'image' : 'file'
  let response: PinnedAssetResponse
  try {
    response = await fetchPublicAsset(url)
  } catch (error) {
    throw new Error(`Required ${assetLabel} ${sourceLabel} could not be fetched safely`, {
      cause: error,
    })
  }
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Required ${assetLabel} ${sourceLabel} returned HTTP ${response.status}`)
  }

  const declaredBytes = Number(firstHeader(response.headers, 'content-length'))
  if (Number.isFinite(declaredBytes) && declaredBytes > MAX_ASSET_BYTES) {
    throw new Error(
      `Required ${assetLabel} ${sourceLabel} exceeds the ${MAX_ASSET_BYTES}-byte limit`,
    )
  }
  const bytes = response.bytes
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_ASSET_BYTES) {
    throw new Error(`Required ${assetLabel} ${sourceLabel} has invalid size ${bytes.byteLength}`)
  }

  const contentType = firstHeader(response.headers, 'content-type')
    ?.split(';', 1)[0]
    ?.trim()
    .toLowerCase()
  const extension =
    kind === 'file'
      ? 'bin'
      : ((contentType && CONTENT_TYPE_EXTENSIONS.get(contentType)) ??
        extensionFromUrl(response.finalUrl))
  if (kind === 'image' && !extension) {
    throw new Error(
      `Required image ${sourceLabel} has unsupported content type ${contentType ?? '(missing)'}`,
    )
  }

  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const filename = `${sha256}.${extension}`
  const outputDirectory = resolve(generatedPublicRoot, 'assets')
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(resolve(outputDirectory, filename), bytes)
  return {
    publicPath: `/_musubi/generated/assets/${filename}`,
    sha256,
    bytes: bytes.byteLength,
  }
}

async function stabilizeImage(
  image: MusubiImage,
  getAsset: (url: string, kind: AssetKind) => Promise<DownloadedAsset>,
): Promise<MusubiImage> {
  if (!/^https?:\/\//i.test(image.src)) {
    return image
  }
  const asset = await getAsset(image.src, 'image')
  return { ...image, src: asset.publicPath }
}

async function stabilizeFile(
  file: MusubiFile,
  getAsset: (url: string, kind: AssetKind) => Promise<DownloadedAsset>,
): Promise<MusubiFile> {
  if (!/^https?:\/\//i.test(file.src)) {
    return file
  }
  const asset = await getAsset(file.src, 'file')
  return { ...file, src: asset.publicPath }
}

async function stabilizeItem(
  item: MusubiListItem,
  getAsset: (url: string, kind: AssetKind) => Promise<DownloadedAsset>,
): Promise<MusubiListItem> {
  return {
    ...item,
    children: await mapConcurrent(item.children, 4, (block) => stabilizeBlock(block, getAsset)),
  }
}

async function stabilizeBlock(
  block: MusubiBlock,
  getAsset: (url: string, kind: AssetKind) => Promise<DownloadedAsset>,
): Promise<MusubiBlock> {
  switch (block.type) {
    case 'image':
      return stabilizeImage(block, getAsset)
    case 'file':
      return stabilizeFile(block, getAsset)
    case 'list':
      return {
        ...block,
        children: await mapConcurrent(block.children, 4, (item) => stabilizeItem(item, getAsset)),
      }
    case 'quote':
    case 'callout':
      return {
        ...block,
        children: await mapConcurrent(block.children, 4, (child) =>
          stabilizeBlock(child, getAsset),
        ),
      }
    default:
      return block
  }
}

export async function stabilizeDocumentAssets(
  documents: readonly MusubiDocument[],
  generatedPublicRoot: string,
): Promise<StabilizedAssets> {
  const pending = new Map<string, Promise<DownloadedAsset>>()
  const getAsset = (url: string, kind: AssetKind): Promise<DownloadedAsset> => {
    const key = `${kind}:${url}`
    const current = pending.get(key)
    if (current) {
      return current
    }
    const download = downloadAsset(url, generatedPublicRoot, kind)
    pending.set(key, download)
    return download
  }

  const stabilized = await mapConcurrent(documents, 4, async (document) => {
    try {
      return {
        ...document,
        children: await mapConcurrent(document.children, 4, (block) =>
          stabilizeBlock(block, getAsset),
        ),
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown asset failure'
      throw new Error(`${document.pageLabel}: required asset stabilization failed (${detail})`, {
        cause: error,
      })
    }
  })
  const files = await Promise.all(pending.values())
  return {
    documents: stabilized,
    files: [...new Map(files.map((file) => [file.publicPath, file])).values()].sort((left, right) =>
      left.publicPath.localeCompare(right.publicPath),
    ),
  }
}