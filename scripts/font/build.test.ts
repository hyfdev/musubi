import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { fontBuildInputFingerprint } from './build.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  )
})

describe('font build cache', () => {
  it('invalidates when the shared Chinese typography classifier changes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'musubi-font-fingerprint-'))
    temporaryDirectories.push(root)
    const classifier = join(root, 'src/shared/chinese-typography.ts')
    await mkdir(join(root, 'src/shared'), { recursive: true })
    await writeFile(classifier, 'export const classifier = 1\n')
    const options = {
      root,
      environment: {},
      tsangerCachePath: join(root, '.font-cache/tsanger'),
      latinCachePath: join(root, '.font-cache/latin'),
    }

    const before = await fontBuildInputFingerprint(options)
    await writeFile(classifier, 'export const classifier = 2\n')
    const after = await fontBuildInputFingerprint(options)

    expect(after).not.toBe(before)
  })
})