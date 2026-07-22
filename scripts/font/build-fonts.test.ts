import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { buildPublicFonts } from './build-fonts.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  )
})

describe('public font build', () => {
  it('gives W04 and W05 the same Chinese corpus and publishes only required LXGW gaps', async () => {
    const output = await mkdtemp(join(tmpdir(), 'musubi-font-build-'))
    temporaryDirectories.push(output)
    const rareLxgwOnlyCharacter = String.fromCodePoint(0x4dae)
    const manifest = await buildPublicFonts(
      {
        text: `English — prose © # … 0123456789\n中${rareLxgwOnlyCharacter}`,
        code: 'typescript\nconst value = 1',
      },
      output,
    )

    expect(Boolean(manifest.artifacts.tsangerW04)).toBe(Boolean(manifest.artifacts.tsangerW05))
    if (manifest.artifacts.tsangerW04 && manifest.artifacts.tsangerW05) {
      expect(manifest.artifacts.tsangerW04.coverage.codePoints).toEqual(['U+4E2D'])
      expect(manifest.artifacts.tsangerW05.coverage.codePoints).toEqual(['U+4E2D'])
    }
    const fallbackCodePoints = manifest.artifacts.fallbackShards.flatMap(
      (artifact) => artifact.coverage.codePoints,
    )
    expect(fallbackCodePoints).toContain('U+4DAE')
    if (!manifest.artifacts.tsangerW04) expect(fallbackCodePoints).toContain('U+4E2D')
    for (const artifact of manifest.artifacts.fallbackShards) {
      expect(artifact.coverage.cssUnicodeRange).not.toContain('U+0020')
    }
    for (const artifact of manifest.artifacts.charter) {
      expect(artifact.coverage.codePoints).toEqual(
        expect.arrayContaining([
          'U+0023',
          'U+0030',
          'U+0031',
          'U+0032',
          'U+0033',
          'U+0034',
          'U+0035',
          'U+0036',
          'U+0037',
          'U+0038',
          'U+0039',
          'U+00A9',
          'U+2026',
        ]),
      )
    }
    for (const artifact of manifest.artifacts.jetbrainsMono) {
      expect(artifact.coverage.codePoints).toEqual(
        expect.arrayContaining([
          'U+0063',
          'U+0065',
          'U+0069',
          'U+0070',
          'U+0072',
          'U+0073',
          'U+0074',
          'U+0079',
        ]),
      )
    }
    expect(manifest.selectedCorpora.chinese.codePoints).toEqual(['U+4DAE', 'U+4E2D'])
  }, 60_000)
})