import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmod, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const DOWNLOAD_ATTEMPTS = 4
const PAIR_MARKER_FILE = 'tsanger-jinkai-02-pair.json'

interface TsangerFontSource {
  weight: 'W04' | 'W05'
  fileName: string
  url: string
  productUrl: string
  bytes: number
  sha256: string
}

/** Public CDN copies of the pinned files (same bytes/SHA-256 as the official downloads). */
const JSDELIVR_TSANGER_FONT_BASE =
  'https://cdn.jsdelivr.net/gh/tw93/Kami@main/assets/fonts' as const

export const TSANGER_FONT_SOURCES = {
  w04: {
    weight: 'W04',
    fileName: 'TsangerJinKai02-W04.ttf',
    url: 'https://tsanger.cn/download/%E4%BB%93%E8%80%B3%E4%BB%8A%E6%A5%B702-W04.ttf',
    productUrl: 'https://tsanger.cn/product/33',
    bytes: 18_948_244,
    sha256: '47a9b416c27ad5436794c880ce3f666a3135a862ed1e2c91aa7db48914a6a487',
  },
  w05: {
    weight: 'W05',
    fileName: 'TsangerJinKai02-W05.ttf',
    url: 'https://tsanger.cn/download/%E4%BB%93%E8%80%B3%E4%BB%8A%E6%A5%B702-W05.ttf',
    productUrl: 'https://tsanger.cn/product/34',
    bytes: 18_953_516,
    sha256: '9744dc96801ec8c91a3390bed24c993d4722fb406e1d879177d343d40e985a6e',
  },
} as const satisfies Record<'w04' | 'w05', TsangerFontSource>

export interface InstalledTsangerFont {
  buffer: Buffer
  path: string
  bytes: number
  sha256: string
}

export interface InstalledTsangerFonts {
  directory: string
  w04: InstalledTsangerFont
  w05: InstalledTsangerFont
}

export interface TsangerFontCacheInspection {
  directory: string
  w04: InstalledTsangerFont | null
  w05: InstalledTsangerFont | null
}

type SetupReporter = (message: string) => void

interface TsangerPairMarker {
  schemaVersion: 1
  pairId: string
  w04: { bytes: number; sha256: string }
  w05: { bytes: number; sha256: string }
}

const PAIR_MARKER: TsangerPairMarker = {
  schemaVersion: 1,
  pairId: createHash('sha256')
    .update(`${TSANGER_FONT_SOURCES.w04.sha256}:${TSANGER_FONT_SOURCES.w05.sha256}`)
    .digest('hex'),
  w04: {
    bytes: TSANGER_FONT_SOURCES.w04.bytes,
    sha256: TSANGER_FONT_SOURCES.w04.sha256,
  },
  w05: {
    bytes: TSANGER_FONT_SOURCES.w05.bytes,
    sha256: TSANGER_FONT_SOURCES.w05.sha256,
  },
}

export function tsangerFontCacheDirectory(): string {
  const override = process.env.MUSUBI_TSANGER_CACHE_DIR?.trim()
  return override ? resolve(override) : resolve('.musubi', 'font', 'tsanger')
}

/**
 * Resolve download URL candidates for font:setup (tried in order until checksum matches).
 *
 * 1. Paired `MUSUBI_TSANGER_W04_URL` / `MUSUBI_TSANGER_W05_URL` when both are set (builder mirrors only).
 * 2. Otherwise: jsDelivr copy of the pinned files, then the official tsanger.cn downloads.
 *
 * Checksums and sizes stay pinned to the known W04/W05 pair.
 */
export function resolveTsangerDownloadUrls(source: TsangerFontSource): string[] {
  const w04Url = process.env.MUSUBI_TSANGER_W04_URL?.trim()
  const w05Url = process.env.MUSUBI_TSANGER_W05_URL?.trim()
  if (w04Url || w05Url) {
    if (!w04Url || !w05Url) {
      throw new Error(
        'MUSUBI_TSANGER_W04_URL and MUSUBI_TSANGER_W05_URL must be provided together when overriding Tsanger download URLs.',
      )
    }
    const override = source.weight === 'W04' ? w04Url : w05Url
    assertHttpsDownloadUrl(
      override,
      source.weight === 'W04' ? 'MUSUBI_TSANGER_W04_URL' : 'MUSUBI_TSANGER_W05_URL',
    )
    return [override]
  }
  return [`${JSDELIVR_TSANGER_FONT_BASE}/${source.fileName}`, source.url]
}

export function tsangerDownloadUrlsAreOverridden(): boolean {
  return Boolean(
    process.env.MUSUBI_TSANGER_W04_URL?.trim() || process.env.MUSUBI_TSANGER_W05_URL?.trim(),
  )
}

function assertHttpsDownloadUrl(url: string, name: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch (error) {
    throw new Error(`${name} is not a valid URL.`, { cause: error })
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`${name} must use https.`)
  }
}

export async function inspectTsangerFontCache(): Promise<TsangerFontCacheInspection> {
  const directory = tsangerFontCacheDirectory()
  const marker = await readPairMarker(directory)
  if (!marker) return { directory, w04: null, w05: null }
  assertPairMarker(marker)
  const [w04, w05] = await Promise.all([
    readVerifiedCachedFont(directory, TSANGER_FONT_SOURCES.w04),
    readVerifiedCachedFont(directory, TSANGER_FONT_SOURCES.w05),
  ])
  if (!w04 || !w05) {
    throw new Error(
      `The optional Tsanger JinKai cache in ${directory} is activated but incomplete or corrupt; rerun "vp run font:setup".`,
    )
  }
  return { directory, w04, w05 }
}

export async function setupTsangerFonts(
  report: SetupReporter = () => undefined,
): Promise<InstalledTsangerFonts> {
  const directory = tsangerFontCacheDirectory()
  const sources = {
    w04: { ...TSANGER_FONT_SOURCES.w04 },
    w05: { ...TSANGER_FONT_SOURCES.w05 },
  }
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await chmod(directory, 0o700)
  const [cachedW04, cachedW05] = await Promise.all([
    readVerifiedCachedFont(directory, sources.w04),
    readVerifiedCachedFont(directory, sources.w05),
  ])
  if (cachedW04 && cachedW05) {
    await writePairMarker(directory)
    report(`Tsanger JinKai W04 and W05 are already ready in ${directory}.`)
    return {
      directory,
      w04: cachedW04,
      w05: cachedW05,
    }
  }

  if (tsangerDownloadUrlsAreOverridden()) {
    report('Using MUSUBI_TSANGER_W04_URL and MUSUBI_TSANGER_W05_URL for Tsanger source downloads.')
  } else {
    report('Trying jsDelivr first, then the official tsanger.cn downloads.')
  }

  const staged = new Map<TsangerFontSource, string>()
  for (const source of Object.values(sources)) {
    const installed = source.weight === 'W04' ? cachedW04 : cachedW05
    if (installed) continue
    const partPath = partialPath(directory, source)
    await downloadVerifiedFont(source, partPath, report)
    staged.set(source, partPath)
  }

  for (const [source, partPath] of staged) {
    const destination = cachedPath(directory, source)
    await rename(partPath, destination)
    await chmod(destination, 0o600)
  }

  await writePairMarker(directory)
  const installed = await inspectTsangerFontCache()
  if (!installed.w04 || !installed.w05) {
    throw new Error('Tsanger JinKai setup finished without a complete verified W04/W05 pair.')
  }
  return {
    directory: installed.directory,
    w04: installed.w04,
    w05: installed.w05,
  }
}

export async function clearTsangerFonts(): Promise<string> {
  const directory = tsangerFontCacheDirectory()
  await Promise.all([
    rm(pairMarkerPath(directory), { force: true }),
    ...Object.values(TSANGER_FONT_SOURCES).flatMap((source) => [
      rm(cachedPath(directory, source), { force: true }),
      rm(partialPath(directory, source), { force: true }),
    ]),
  ])
  return directory
}

async function readVerifiedCachedFont(
  directory: string,
  source: TsangerFontSource,
): Promise<InstalledTsangerFont | null> {
  const path = cachedPath(directory, source)
  const buffer = await readFile(path).catch(() => null)
  if (!buffer) return null
  if (buffer.length !== source.bytes || sha256(buffer) !== source.sha256) {
    await rm(path, { force: true })
    return null
  }
  await chmod(path, 0o600)
  return {
    buffer,
    path,
    bytes: buffer.length,
    sha256: source.sha256,
  }
}

async function downloadVerifiedFont(
  source: TsangerFontSource,
  partPath: string,
  report: SetupReporter,
): Promise<void> {
  const urls = resolveTsangerDownloadUrls(source)
  const failures: string[] = []

  for (const url of urls) {
    report(`Downloading Tsanger JinKai ${source.weight} from ${describeDownloadHost(url)}...`)
    for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
      try {
        const existingSize = await fileSize(partPath)
        if (existingSize === source.bytes) {
          const complete = await readFile(partPath)
          if (sha256(complete) === source.sha256) {
            await chmod(partPath, 0o600)
            report(`Verified Tsanger JinKai ${source.weight} (${formatBytes(source.bytes)}).`)
            return
          }
          await rm(partPath, { force: true })
        } else if (existingSize > source.bytes) {
          await rm(partPath, { force: true })
        }

        await downloadAttempt(url, source.bytes, partPath)
        const downloaded = await readFile(partPath)
        const actualChecksum = sha256(downloaded)
        if (downloaded.length !== source.bytes || actualChecksum !== source.sha256) {
          await rm(partPath, { force: true })
          throw new Error(
            `download verification failed: expected ${source.bytes} bytes and ${source.sha256}, received ${downloaded.length} bytes and ${actualChecksum}`,
          )
        }
        await chmod(partPath, 0o600)
        report(`Verified Tsanger JinKai ${source.weight} (${formatBytes(source.bytes)}).`)
        return
      } catch (error) {
        if (attempt === DOWNLOAD_ATTEMPTS) {
          failures.push(`${describeDownloadHost(url)}: ${errorMessage(error)}`)
          await rm(partPath, { force: true })
          break
        }
        report(
          `Tsanger JinKai ${source.weight} download was interrupted; retrying from the saved partial file (${attempt}/${DOWNLOAD_ATTEMPTS}).`,
        )
        await delay(attempt * 1000)
      }
    }
  }

  throw new Error(
    `Unable to install Tsanger JinKai ${source.weight} from any download source: ${failures.join('; ')}`,
  )
}

async function downloadAttempt(url: string, maxBytes: number, partPath: string): Promise<void> {
  // Official tsanger.cn files are direct. jsDelivr and builder mirrors may redirect.
  const officialUrl = url === TSANGER_FONT_SOURCES.w04.url || url === TSANGER_FONT_SOURCES.w05.url
  const maxRedirs = officialUrl ? '0' : '5'
  const code = await runCurl([
    '--fail',
    '--show-error',
    '--location',
    '--max-redirs',
    maxRedirs,
    '--proto',
    '=https',
    '--proto-redir',
    '=https',
    '--connect-timeout',
    '20',
    '--speed-limit',
    '1',
    '--speed-time',
    '60',
    '--max-filesize',
    String(maxBytes),
    '--continue-at',
    '-',
    '--output',
    partPath,
    url,
  ])
  if (code !== 0) {
    if (code === 33 || code === 36) {
      await rm(partPath, { force: true })
    }
    throw new Error(`curl exited with status ${code}`)
  }
}

function describeDownloadHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return 'download URL'
  }
}

function cachedPath(directory: string, source: TsangerFontSource): string {
  return join(directory, `${source.sha256}-${source.fileName}`)
}

function partialPath(directory: string, source: TsangerFontSource): string {
  return join(directory, `.${source.sha256}-${source.fileName}.part`)
}

function pairMarkerPath(directory: string): string {
  return join(directory, PAIR_MARKER_FILE)
}

async function readPairMarker(directory: string): Promise<unknown> {
  const source = await readFile(pairMarkerPath(directory), 'utf8').catch(() => null)
  if (!source) return null
  try {
    return JSON.parse(source) as unknown
  } catch (error) {
    throw new Error(`The optional Tsanger JinKai cache marker in ${directory} is invalid JSON.`, {
      cause: error,
    })
  }
}

function assertPairMarker(marker: unknown): asserts marker is TsangerPairMarker {
  if (JSON.stringify(marker) !== JSON.stringify(PAIR_MARKER)) {
    throw new Error(
      'The optional Tsanger JinKai cache marker does not match this Musubi version; rerun "vp run font:setup".',
    )
  }
}

async function writePairMarker(directory: string): Promise<void> {
  const destination = pairMarkerPath(directory)
  const temporary = `${destination}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(PAIR_MARKER, null, 2)}\n`, { mode: 0o600 })
  await rename(temporary, destination)
  await chmod(destination, 0o600)
}

async function fileSize(path: string): Promise<number> {
  return (await stat(path).catch(() => null))?.size ?? 0
}

async function runCurl(args: string[]): Promise<number | null> {
  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('curl', args, { stdio: ['ignore', 'ignore', 'inherit'] })
    child.once('error', (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        rejectPromise(
          new Error(
            'font:setup requires curl with HTTPS support. Install curl, set paired MUSUBI_TSANGER_W04_URL/MUSUBI_TSANGER_W05_URL mirrors, or set MUSUBI_TSANGER_SETUP=0 to skip download (then use font:build PATH overrides or Fallback).',
            { cause: error },
          ),
        )
        return
      }
      rejectPromise(error)
    })
    child.once('close', (code) => resolvePromise(code))
  })
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}