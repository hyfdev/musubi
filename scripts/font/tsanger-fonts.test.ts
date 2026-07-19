import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import {
  clearTsangerFonts,
  inspectTsangerFontCache,
  resolveTsangerDownloadSources,
  TSANGER_FONT_SOURCES,
  tsangerFontCacheDirectory,
} from './tsanger-fonts.ts'

const originalCacheDirectory = process.env.MUSUBI_TSANGER_CACHE_DIR
const originalW04Url = process.env.MUSUBI_TSANGER_W04_URL
const originalW05Url = process.env.MUSUBI_TSANGER_W05_URL
const temporaryDirectories: string[] = []

afterEach(async () => {
  restoreEnv('MUSUBI_TSANGER_CACHE_DIR', originalCacheDirectory)
  restoreEnv('MUSUBI_TSANGER_W04_URL', originalW04Url)
  restoreEnv('MUSUBI_TSANGER_W05_URL', originalW05Url)
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  )
})

describe('optional Tsanger font cache', () => {
  it('treats an absent project cache as the normal fallback state', async () => {
    const directory = await temporaryCache()
    const inspection = await inspectTsangerFontCache()

    expect(inspection).toEqual({ directory, w04: null, w05: null })
  })

  it('does not activate an interrupted setup without the pair marker', async () => {
    const directory = await temporaryCache()
    await writeFile(join(directory, '.partial-download.part'), 'partial')

    const inspection = await inspectTsangerFontCache()
    expect(inspection.w04).toBeNull()
    expect(inspection.w05).toBeNull()
  })

  it('rejects an incompatible activation marker instead of silently changing typography', async () => {
    const directory = await temporaryCache()
    await writeFile(join(directory, 'tsanger-jinkai-02-pair.json'), '{}')

    await expect(inspectTsangerFontCache()).rejects.toThrow(
      'cache marker does not match this Musubi version',
    )
  })

  it('clears optional activation state without affecting the default fallback', async () => {
    const directory = await temporaryCache()
    await writeFile(join(directory, 'tsanger-jinkai-02-pair.json'), '{}')

    await expect(clearTsangerFonts()).resolves.toBe(directory)
    await expect(inspectTsangerFontCache()).resolves.toEqual({
      directory,
      w04: null,
      w05: null,
    })
  })
})

describe('optional Tsanger download URL overrides', () => {
  it('defaults to the official download hosts', () => {
    delete process.env.MUSUBI_TSANGER_W04_URL
    delete process.env.MUSUBI_TSANGER_W05_URL

    expect(resolveTsangerDownloadSources()).toEqual({
      w04: { ...TSANGER_FONT_SOURCES.w04 },
      w05: { ...TSANGER_FONT_SOURCES.w05 },
    })
  })

  it('accepts paired HTTPS URL overrides without changing checksum pins', () => {
    process.env.MUSUBI_TSANGER_W04_URL = 'https://example.invalid/w04.ttf'
    process.env.MUSUBI_TSANGER_W05_URL = 'https://example.invalid/w05.ttf'

    const sources = resolveTsangerDownloadSources()
    expect(sources.w04.url).toBe('https://example.invalid/w04.ttf')
    expect(sources.w05.url).toBe('https://example.invalid/w05.ttf')
    expect(sources.w04.sha256).toBe(TSANGER_FONT_SOURCES.w04.sha256)
    expect(sources.w05.sha256).toBe(TSANGER_FONT_SOURCES.w05.sha256)
    expect(sources.w04.bytes).toBe(TSANGER_FONT_SOURCES.w04.bytes)
    expect(sources.w05.bytes).toBe(TSANGER_FONT_SOURCES.w05.bytes)
  })

  it('rejects a single URL override', () => {
    process.env.MUSUBI_TSANGER_W04_URL = 'https://example.invalid/w04.ttf'
    delete process.env.MUSUBI_TSANGER_W05_URL

    expect(() => resolveTsangerDownloadSources()).toThrow(
      'MUSUBI_TSANGER_W04_URL and MUSUBI_TSANGER_W05_URL must be provided together',
    )
  })

  it('rejects non-HTTPS download URLs', () => {
    process.env.MUSUBI_TSANGER_W04_URL = 'http://example.invalid/w04.ttf'
    process.env.MUSUBI_TSANGER_W05_URL = 'https://example.invalid/w05.ttf'

    expect(() => resolveTsangerDownloadSources()).toThrow('MUSUBI_TSANGER_W04_URL must use https')
  })
})

async function temporaryCache(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'musubi-tsanger-cache-'))
  temporaryDirectories.push(directory)
  process.env.MUSUBI_TSANGER_CACHE_DIR = directory
  expect(tsangerFontCacheDirectory()).toBe(directory)
  return directory
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}