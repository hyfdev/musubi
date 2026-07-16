import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { verifyStaticArtifact } from './verify-static-artifact.mjs'

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  )
})

describe('static font artifact boundary', () => {
  it('accepts generated WOFF2 artifacts', async () => {
    const root = await validArtifact()
    await mkdir(join(root, '_musubi/generated/fonts'), { recursive: true })
    await writeFile(join(root, '_musubi/generated/fonts/body.woff2'), 'generated subset')

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).resolves.toMatchObject({
      root,
    })
  })

  it.each(['ttf', 'otf', 'ttc', 'otc'])(
    'rejects an upstream .%s font source',
    async (extension) => {
      const root = await validArtifact()
      await mkdir(join(root, '_musubi/generated/fonts'), { recursive: true })
      await writeFile(join(root, `_musubi/generated/fonts/source.${extension}`), 'upstream source')

      await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
        `Static artifact contains an upstream font source: _musubi/generated/fonts/source.${extension}`,
      )
    },
  )
})

describe('static route completeness', () => {
  it('rejects a missing generated route', async () => {
    const root = await validArtifact()
    await mkdir(join(root, 'blog/quiet-builds'), { recursive: true })
    await writeFile(
      join(root, 'blog/quiet-builds/index.html'),
      '<!doctype html><title>Post</title>',
    )
    await rm(join(root, 'blog/quiet-builds/index.html'))

    await expect(
      verifyStaticArtifact(root, { expectedRoutes: ['/', '/blog/quiet-builds'] }),
    ).rejects.toThrow(
      'Static artifact is missing route /blog/quiet-builds: blog/quiet-builds/index.html',
    )
  })
})

async function validArtifact() {
  const root = await mkdtemp(join(tmpdir(), 'musubi-static-artifact-'))
  temporaryDirectories.push(root)
  await writeFile(join(root, 'index.html'), '<!doctype html><title>Musubi</title>')
  await writeFile(
    join(root, '404.html'),
    '<!doctype html><title>Page not found</title><a href="/">Home</a>',
  )
  return root
}