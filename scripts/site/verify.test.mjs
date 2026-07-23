import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { renderWranglerConfig } from './deployment.mjs'
import { verifyDeploymentOutput, verifyStaticArtifact } from './verify.mjs'

const temporaryDirectories = []
const HEADER_BLOCKS = {
  hsts: ['/*', '  Strict-Transport-Security: max-age=63072000'],
  void: ['/assets/*', '  Cache-Control: public, max-age=31536000, immutable'],
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

  it('accepts content-addressed Void client assets and page data', async () => {
    const root = await validArtifact()
    await mkdir(join(root, 'assets'), { recursive: true })
    await writeFile(join(root, 'assets/entry-D_6GC0Tp.js'), 'export {}')

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).resolves.toMatchObject({
      root,
    })
  })

  it('rejects JavaScript outside Void assets', async () => {
    const root = await validArtifact()
    await writeFile(join(root, 'surprise.js'), 'alert(1)')

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      'Static artifact contains unexpected browser JavaScript: surprise.js',
    )
  })

  it('rejects an unhashed file under immutable Void asset caching', async () => {
    const root = await validArtifact()
    await mkdir(join(root, 'assets'), { recursive: true })
    await writeFile(join(root, 'assets/logo.svg'), '<svg/>')

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      'Static artifact contains a non-content-addressed Void asset under immutable caching: assets/logo.svg',
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

  it('rejects a missing runtime fallback shard', async () => {
    const root = await validArtifact()
    await rm(join(root, '_musubi/generated/fonts/runtime-fallback-0.woff2'))

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      'Static artifact is missing runtime fallback shard: fonts/runtime-fallback-0.woff2',
    )
  })

  it('rejects ASCII exposed by the runtime fallback', async () => {
    const root = await validArtifact()
    const path = join(root, '_musubi/generated/fonts/fonts-manifest.json')
    const manifest = JSON.parse(await readFile(path, 'utf8'))
    manifest.artifacts.fallbackShards[0].coverage.ranges = ['U+0041']
    manifest.artifacts.fallbackShards[0].coverage.cssUnicodeRange = 'U+0041'
    await writeFile(path, JSON.stringify(manifest))
    const cssPath = join(root, '_musubi/generated/fonts/fonts-0123456789abcdef.css')
    const css = await readFile(cssPath, 'utf8')
    await writeFile(cssPath, css.replace('unicode-range: U+3400;', 'unicode-range: U+0041;'))

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      'Static runtime fallback exposes ASCII through U+0041',
    )
  })

  it('rejects a runtime fallback shard whose bytes no longer match its manifest', async () => {
    const root = await validArtifact()
    await writeFile(
      join(root, '_musubi/generated/fonts/runtime-fallback-0.woff2'),
      'tamperd fallback',
    )

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      'Static artifact runtime fallback hash differs: fonts/runtime-fallback-0.woff2',
    )
  })

  it('rejects a runtime fallback shard with the wrong CSS range', async () => {
    const root = await validArtifact()
    const cssPath = join(root, '_musubi/generated/fonts/fonts-0123456789abcdef.css')
    const css = await readFile(cssPath, 'utf8')
    await writeFile(cssPath, css.replace('unicode-range: U+3400;', 'unicode-range: U+3500;'))

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      'Static artifact font CSS misdeclares runtime fallback shard: fonts/runtime-fallback-0.woff2',
    )
  })
})

describe('static route completeness', () => {
  it('rejects a missing generated route', async () => {
    const root = await validArtifact()
    await mkdir(join(root, 'blog'), { recursive: true })
    await mkdir(join(root, '_void/pages/blog'), { recursive: true })
    await writeFile(join(root, 'blog/quiet-builds.html'), '<!doctype html><title>Post</title>')
    await writeFile(join(root, '_void/pages/blog/quiet-builds.json'), '{"props":{}}')
    await rm(join(root, 'blog/quiet-builds.html'))

    await expect(
      verifyStaticArtifact(root, { expectedRoutes: ['/', '/blog/quiet-builds'] }),
    ).rejects.toThrow('Static artifact is missing route /blog/quiet-builds: blog/quiet-builds.html')
  })

  it('rejects missing page data even when the HTML route exists', async () => {
    const root = await validArtifact()
    await mkdir(join(root, 'blog'), { recursive: true })
    await writeFile(join(root, 'blog/quiet-builds.html'), '<!doctype html><title>Post</title>')

    await expect(
      verifyStaticArtifact(root, { expectedRoutes: ['/', '/blog/quiet-builds'] }),
    ).rejects.toThrow(
      'Static artifact is missing page data /blog/quiet-builds: _void/pages/blog/quiet-builds.json',
    )
  })

  it('rejects internal snapshot labels in public page data', async () => {
    const root = await validArtifact()
    await writeFile(
      join(root, '_void/pages/index.json'),
      '{"props":{"pageLabel":"\\u002Fbuild\\u002F.musubi\\u002Fnotion-data-snapshot"}}',
    )

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      'Static artifact exposes an internal Notion snapshot label: _void/pages/index.json',
    )
  })
})

describe('static delivery controls', () => {
  it('targets the current Cloudflare Worker', () => {
    expect(JSON.parse(renderWranglerConfig()).name).toBe('musubi')
  })

  it.each([
    ['HSTS', 'hsts'],
    ['Void asset immutable cache', 'void'],
    ['font immutable cache', 'fonts'],
    ['font CSS immutable cache', 'fontCss'],
    ['workers.dev noindex', 'preview'],
  ])('rejects a missing %s header block', async (name, omittedBlock) => {
    const root = await validArtifact({ omittedHeaderBlock: omittedBlock })

    await expect(verifyStaticArtifact(root, { expectedRoutes: ['/'] })).rejects.toThrow(
      `Static artifact _headers is missing required block: ${name}`,
    )
  })

  it('accepts the generated Wrangler configuration while retaining the SSR artifact', async () => {
    const workspaceRoot = await validDeploymentOutput()
    const distRoot = join(workspaceRoot, 'dist')
    const configPath = join(workspaceRoot, 'wrangler.json')
    const deployConfigPath = join(workspaceRoot, '.wrangler/deploy/config.json')
    await mkdir(join(distRoot, 'ssr'))

    await expect(
      verifyDeploymentOutput({ distRoot, configPath, deployConfigPath }),
    ).resolves.toEqual({
      configPath,
      clientRoot: join(distRoot, 'client'),
    })
  })

  it('rejects a changed generated Wrangler configuration', async () => {
    const workspaceRoot = await validDeploymentOutput()
    const distRoot = join(workspaceRoot, 'dist')
    const configPath = join(workspaceRoot, 'wrangler.json')
    const deployConfigPath = join(workspaceRoot, '.wrangler/deploy/config.json')
    await writeFile(configPath, renderWranglerConfig().replace('"./dist/client"', '"./dist/ssr"'))

    await expect(
      verifyDeploymentOutput({ distRoot, configPath, deployConfigPath }),
    ).rejects.toThrow('wrangler.json differs from the generated contract')
  })

  it('rejects a Wrangler deploy redirect that would override the root configuration', async () => {
    const workspaceRoot = await validDeploymentOutput()
    const distRoot = join(workspaceRoot, 'dist')
    const configPath = join(workspaceRoot, 'wrangler.json')
    const deployConfigPath = join(workspaceRoot, '.wrangler/deploy/config.json')
    await mkdir(join(workspaceRoot, '.wrangler/deploy'), { recursive: true })
    await writeFile(deployConfigPath, '{"configPath":"../../dist/wrangler.json"}')

    await expect(
      verifyDeploymentOutput({ distRoot, configPath, deployConfigPath }),
    ).rejects.toThrow('.wrangler/deploy/config.json')
  })
})

async function validDeploymentOutput() {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'musubi-deployment-output-'))
  temporaryDirectories.push(workspaceRoot)
  await mkdir(join(workspaceRoot, 'dist'), { recursive: true })
  await writeFile(join(workspaceRoot, 'wrangler.json'), renderWranglerConfig())
  return workspaceRoot
}

async function validArtifact({ omittedHeaderBlock } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'musubi-static-artifact-'))
  temporaryDirectories.push(root)
  await mkdir(join(root, '_musubi/generated/fonts'), { recursive: true })
  await mkdir(join(root, '_void/pages'), { recursive: true })
  const fallbackBytes = Buffer.from('runtime fallback')
  const fallbackShards = Array.from({ length: 32 }, (_, index) => {
    const codePoint = 0x3400 + index
    const range = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
    return {
      path: `fonts/runtime-fallback-${index}.woff2`,
      family: 'Musubi CJK Fallback',
      bytes: fallbackBytes.length,
      sha256: createHash('sha256').update(fallbackBytes).digest('hex'),
      coverage: { count: 1, ranges: [range], cssUnicodeRange: range, codePoints: [] },
    }
  })
  await Promise.all(
    fallbackShards.map((shard) =>
      writeFile(join(root, '_musubi/generated', shard.path), fallbackBytes),
    ),
  )
  await writeFile(
    join(root, 'index.html'),
    '<!doctype html><title>Musubi</title><link rel="stylesheet" href="/_musubi/generated/fonts/fonts-0123456789abcdef.css">',
  )
  await writeFile(
    join(root, '_musubi/generated/fonts/fonts-0123456789abcdef.css'),
    fallbackShards
      .map(
        (shard) =>
          `@font-face { font-family: 'Musubi CJK Fallback'; src: url('/_musubi/generated/${shard.path}'); font-style: normal; font-weight: 400 500; unicode-range: ${shard.coverage.cssUnicodeRange}; }`,
      )
      .join('\n'),
  )
  await writeFile(
    join(root, '_musubi/generated/fonts/fonts-manifest.json'),
    JSON.stringify({
      schemaVersion: 6,
      sources: {
        fallback: {
          runtimeCmapCodePointCount: fallbackShards.length,
          sharding: { shardCount: 32, maxShardBytes: 600_000 },
        },
      },
      artifacts: { fallbackShards },
    }),
  )
  await writeFile(
    join(root, '404.html'),
    '<!doctype html><title>Page not found</title><a href="/">Home</a>',
  )
  await writeFile(join(root, '_void/pages/index.json'), '{"props":{}}')
  await writeFile(join(root, '_void/pages/404.json'), '{"props":{}}')
  await writeFile(
    join(root, '_headers'),
    Object.entries(HEADER_BLOCKS)
      .filter(([name]) => name !== omittedHeaderBlock)
      .flatMap(([, lines]) => [...lines, ''])
      .join('\n'),
  )
  return root
}