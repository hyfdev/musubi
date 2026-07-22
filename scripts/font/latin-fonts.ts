import { createHash } from 'node:crypto'
import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const DOWNLOAD_ATTEMPTS = 4
const CHARTER_COMMIT = '149bc9ee81cc87b78152df8fce207823969873f8'
const CHARTER_BASE = `https://raw.githubusercontent.com/chawyehsu/charter-webfont/${CHARTER_COMMIT}/fonts`
const JETBRAINS_MONO_RELEASE = 'v2.304'
const JETBRAINS_MONO_BASE = `https://raw.githubusercontent.com/JetBrains/JetBrainsMono/${JETBRAINS_MONO_RELEASE}/fonts/webfonts`

interface LatinFontSource {
  family: 'Charter' | 'JetBrains Mono'
  style: 'normal' | 'italic'
  weight: 400 | 700
  fileName: string
  url: string
  bytes: number
  sha256: string
}

export const LATIN_FONT_SOURCES = {
  charterRegular: {
    family: 'Charter',
    style: 'normal',
    weight: 400,
    fileName: 'charter_regular.woff2',
    url: `${CHARTER_BASE}/charter_regular.woff2`,
    bytes: 14_648,
    sha256: '8e7630ba96aeed2974bfd9ab9bde2d3159e4cba98dfdb5757584e3542f1ac962',
  },
  charterItalic: {
    family: 'Charter',
    style: 'italic',
    weight: 400,
    fileName: 'charter_italic.woff2',
    url: `${CHARTER_BASE}/charter_italic.woff2`,
    bytes: 15_376,
    sha256: '35b98e2d6da9ab1d3580aee832f6d8ddfc3687cfd8e12e4e699aa202a70446e2',
  },
  charterBold: {
    family: 'Charter',
    style: 'normal',
    weight: 700,
    fileName: 'charter_bold.woff2',
    url: `${CHARTER_BASE}/charter_bold.woff2`,
    bytes: 15_028,
    sha256: 'ca7c6aadefb1318729ac10048a85faeb6eccfbe4d4ecb2e582747663a3915792',
  },
  charterBoldItalic: {
    family: 'Charter',
    style: 'italic',
    weight: 700,
    fileName: 'charter_bold_italic.woff2',
    url: `${CHARTER_BASE}/charter_bold_italic.woff2`,
    bytes: 16_108,
    sha256: '192919b5cdf9180894546fa74b206885b4e6af737189ec43601d382017f89b60',
  },
  jetbrainsMonoRegular: {
    family: 'JetBrains Mono',
    style: 'normal',
    weight: 400,
    fileName: 'JetBrainsMono-Regular.woff2',
    url: `${JETBRAINS_MONO_BASE}/JetBrainsMono-Regular.woff2`,
    bytes: 92_164,
    sha256: 'a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2',
  },
  jetbrainsMonoItalic: {
    family: 'JetBrains Mono',
    style: 'italic',
    weight: 400,
    fileName: 'JetBrainsMono-Italic.woff2',
    url: `${JETBRAINS_MONO_BASE}/JetBrainsMono-Italic.woff2`,
    bytes: 95_864,
    sha256: 'cb6a1b246318ed3885d7dffa14a2609297fe80e9b8e500bea33b52fa312a36a4',
  },
  jetbrainsMonoBold: {
    family: 'JetBrains Mono',
    style: 'normal',
    weight: 700,
    fileName: 'JetBrainsMono-Bold.woff2',
    url: `${JETBRAINS_MONO_BASE}/JetBrainsMono-Bold.woff2`,
    bytes: 94_588,
    sha256: 'c503cc5ec5f8b2c7666b7ecda1adf44bd45f2e6579b2eba0fc292150416588a2',
  },
  jetbrainsMonoBoldItalic: {
    family: 'JetBrains Mono',
    style: 'italic',
    weight: 700,
    fileName: 'JetBrainsMono-BoldItalic.woff2',
    url: `${JETBRAINS_MONO_BASE}/JetBrainsMono-BoldItalic.woff2`,
    bytes: 98_152,
    sha256: '3a013466c0eee979fb9d42c2d7a8887cd3645dc8b897cfc5b71781cf982efc5a',
  },
} as const satisfies Record<string, LatinFontSource>

export type LatinFontSourceKey = keyof typeof LATIN_FONT_SOURCES

export interface InstalledLatinFont {
  buffer: Buffer
  path: string
  bytes: number
  sha256: string
}

export interface InstalledLatinFonts {
  directory: string
  fonts: Record<LatinFontSourceKey, InstalledLatinFont>
}

export function latinFontCacheDirectory(): string {
  return resolve('.musubi', 'font', 'latin')
}

export async function inspectLatinFontCache(): Promise<InstalledLatinFonts | null> {
  const directory = latinFontCacheDirectory()
  const entries = await Promise.all(
    Object.entries(LATIN_FONT_SOURCES).map(async ([key, source]) => {
      const font = await readVerifiedFont(directory, source)
      return [key as LatinFontSourceKey, font] as const
    }),
  )
  if (entries.every(([, font]) => font === null)) return null
  const missing = entries.filter(([, font]) => font === null).map(([key]) => key)
  if (missing.length > 0) {
    throw new Error(
      `The Latin webfont cache in ${directory} is incomplete; rerun "vp run font:setup". Missing: ${missing.join(', ')}.`,
    )
  }
  return { directory, fonts: Object.fromEntries(entries) as InstalledLatinFonts['fonts'] }
}

export async function setupLatinFonts(
  report: (message: string) => void = () => undefined,
): Promise<InstalledLatinFonts> {
  const directory = latinFontCacheDirectory()
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await chmod(directory, 0o700)

  for (const source of Object.values(LATIN_FONT_SOURCES)) {
    if (await readVerifiedFont(directory, source)) continue
    report(`Downloading ${source.family} ${source.weight} ${source.style}...`)
    await downloadVerifiedFont(directory, source)
  }

  const installed = await inspectLatinFontCache()
  if (!installed) throw new Error('Latin webfont setup completed without any verified fonts.')
  return installed
}

async function downloadVerifiedFont(directory: string, source: LatinFontSource): Promise<void> {
  const destination = cachedPath(directory, source)
  const temporary = `${destination}.${process.pid}.part`
  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(source.url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(60_000),
      })
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length !== source.bytes || sha256(buffer) !== source.sha256) {
        throw new Error(
          `expected ${source.bytes} bytes and ${source.sha256}, received ${buffer.length} bytes and ${sha256(buffer)}`,
        )
      }
      await writeFile(temporary, buffer, { mode: 0o600 })
      await rename(temporary, destination)
      await chmod(destination, 0o600)
      return
    } catch (error) {
      await rm(temporary, { force: true })
      if (attempt === DOWNLOAD_ATTEMPTS) {
        throw new Error(`Unable to install ${source.fileName}: ${errorMessage(error)}`)
      }
      await delay(attempt * 500)
    }
  }
}

async function readVerifiedFont(
  directory: string,
  source: LatinFontSource,
): Promise<InstalledLatinFont | null> {
  const path = cachedPath(directory, source)
  const buffer = await readFile(path).catch(() => null)
  if (!buffer) return null
  if (buffer.length !== source.bytes || sha256(buffer) !== source.sha256) {
    await rm(path, { force: true })
    return null
  }
  await chmod(path, 0o600)
  return { buffer, path, bytes: buffer.length, sha256: source.sha256 }
}

function cachedPath(directory: string, source: LatinFontSource): string {
  return join(directory, `${source.sha256}-${source.fileName}`)
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}