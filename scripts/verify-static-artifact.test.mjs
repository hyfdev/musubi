import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { verifyNoGeneratedDeployRedirect, verifyStaticArtifact } from './verify-static-artifact.mjs'

const temporaryDirectories = []
const HEADER_BLOCKS = {
  hsts: ['/*', '  Strict-Transport-Security: max-age=63072000'],
  nuxt: ['/_nuxt/*', '  Cache-Control: public, max-age=31536000, immutable'],
  fonts: [
    '/_musubi/generated/fonts/*.woff2',
    '  Cache-Control: public, max-age=31536000, immutable',
  ],
  fontCss: [
    '/_musubi/generated/fonts/fonts-*.css',
    '  Cache-Control: public, max-age=31536000, immutable',
  ],
  preview: ['https://:version.:subdomain.workers.dev/*', '  X-Robots-Tag: noindex'],
}

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

  it('accepts Nuxt client chunks and extracted payloads', async () => {
    const root = await validArtifact()
    await mkdir(join(root, '_nuxt'), { recursive: true })
    await writeFile(join(root, '_nuxt/entry.js'), 'export {}')
    await writeFile(join(root, '_payload.json'), '{"data":[]}')

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).resolves.toMatchObject({
      root,
    })
  })

  it('rejects JavaScript outside _nuxt', async () => {
    const root = await validArtifact()
    await writeFile(join(root, 'surprise.js'), 'alert(1)')

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      'Static artifact contains unexpected browser JavaScript: surprise.js',
    )
  })

  it('rejects a public API tree', async () => {
    const root = await validArtifact()
    await mkdir(join(root, 'api/build'), { recursive: true })
    await writeFile(join(root, 'api/build/shell'), '{}')

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      /Static artifact contains a forbidden public data path: api/,
    )
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

describe('static delivery controls', () => {
  it.each([
    ['HSTS', 'hsts'],
    ['Nuxt immutable cache', 'nuxt'],
    ['font immutable cache', 'fonts'],
    ['font CSS immutable cache', 'fontCss'],
    ['workers.dev noindex', 'preview'],
  ])('rejects a missing %s header block', async (name, omittedBlock) => {
    const root = await validArtifact({ omittedHeaderBlock: omittedBlock })

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      `Static artifact _headers is missing required block: ${name}`,
    )
  })

  it('rejects a generated Wrangler redirect', async () => {
    const root = await mkdtemp(join(tmpdir(), 'musubi-wrangler-redirect-'))
    temporaryDirectories.push(root)
    const redirect = join(root, '.wrangler/deploy/config.json')
    await mkdir(join(root, '.wrangler/deploy'), { recursive: true })
    await writeFile(redirect, '{}')

    await expect(verifyNoGeneratedDeployRedirect(redirect)).rejects.toThrow(
      'this would redirect Wrangler away from the repository assets-only configuration',
    )
  })
})

async function validArtifact({ omittedHeaderBlock } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'musubi-static-artifact-'))
  temporaryDirectories.push(root)
  await mkdir(join(root, '_musubi/generated/fonts'), { recursive: true })
  await writeFile(
    join(root, 'index.html'),
    '<!doctype html><title>Musubi</title><link rel="stylesheet" href="/_musubi/generated/fonts/fonts-0123456789abcdef.css">',
  )
  await writeFile(join(root, '_musubi/generated/fonts/fonts-0123456789abcdef.css'), '@font-face {}')
  await writeFile(
    join(root, '404.html'),
    '<!doctype html><title>Page not found</title><a href="/">Home</a>',
  )
  await writeFile(
    join(root, '_headers'),
    Object.entries(HEADER_BLOCKS)
      .filter(([name]) => name !== omittedHeaderBlock)
      .flatMap(([, lines]) => [...lines, ''])
      .join('\n'),
  )
  return root
}