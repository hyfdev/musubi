import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import {
  clearTsangerFonts,
  inspectTsangerFontCache,
  tsangerFontCacheDirectory,
} from './tsanger-fonts.ts'

const originalCacheDirectory = process.env.MUSUBI_TSANGER_CACHE_DIR
const temporaryDirectories: string[] = []

afterEach(async () => {
  if (originalCacheDirectory === undefined) {
    delete process.env.MUSUBI_TSANGER_CACHE_DIR
  } else {
    process.env.MUSUBI_TSANGER_CACHE_DIR = originalCacheDirectory
  }
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

async function temporaryCache(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'musubi-tsanger-cache-'))
  temporaryDirectories.push(directory)
  process.env.MUSUBI_TSANGER_CACHE_DIR = directory
  expect(tsangerFontCacheDirectory()).toBe(directory)
  return directory
}