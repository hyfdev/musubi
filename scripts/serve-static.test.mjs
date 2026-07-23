import { once } from 'node:events'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { cacheControlForArtifactPath, createStaticArtifactServer } from './serve-static.mjs'

const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const REVALIDATE_CACHE_CONTROL = 'public, max-age=0, must-revalidate'
const temporaryDirectories = []
const servers = []

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise((resolve, reject) => {
          server.closeAllConnections()
          server.close((error) => (error ? reject(error) : resolve()))
        }),
    ),
  )
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  )
})

describe('static artifact cache policy', () => {
  it.each([
    ['assets/entry-D_6GC0Tp.css', IMMUTABLE_CACHE_CONTROL],
    [
      '_musubi/generated/fonts/Tsanger-JinKai-W04-subset-0123456789abcdef.woff2',
      IMMUTABLE_CACHE_CONTROL,
    ],
    [
      '_musubi/generated/fonts/Musubi-CJK-Fallback-unified-1-0123456789abcdef.woff2',
      IMMUTABLE_CACHE_CONTROL,
    ],
    ['_musubi/generated/fonts/fonts-0123456789abcdef.css', IMMUTABLE_CACHE_CONTROL],
    ['index.html', REVALIDATE_CACHE_CONTROL],
    ['_musubi/generated/fonts/fonts-unbuilt.css', REVALIDATE_CACHE_CONTROL],
    ['_musubi/generated/fonts/fonts-manifest.json', REVALIDATE_CACHE_CONTROL],
    ['_void/pages/index.json', REVALIDATE_CACHE_CONTROL],
    ['favicon.ico', REVALIDATE_CACHE_CONTROL],
  ])('serves %s with the expected policy', (path, expected) => {
    expect(cacheControlForArtifactPath(path)).toBe(expected)
  })

  it('revalidates HTML and keeps content-addressed resources immutable', async () => {
    const root = await createArtifact()
    const server = createStaticArtifactServer(root)
    servers.push(server)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Expected a TCP test server.')
    const origin = `http://127.0.0.1:${address.port}`

    const html = await fetch(`${origin}/`)
    expect(html.status).toBe(200)
    expect(html.headers.get('cache-control')).toBe(REVALIDATE_CACHE_CONTROL)
    expect(html.headers.get('last-modified')).toBeTruthy()
    const entityTag = html.headers.get('etag')
    expect(entityTag).toBeTruthy()

    const revalidated = await fetch(`${origin}/`, {
      headers: { 'if-none-match': entityTag },
    })
    expect(revalidated.status).toBe(304)
    expect(revalidated.headers.get('cache-control')).toBe(REVALIDATE_CACHE_CONTROL)

    const font = await fetch(
      `${origin}/_musubi/generated/fonts/Tsanger-JinKai-W04-subset-0123456789abcdef.woff2`,
    )
    expect(font.status).toBe(200)
    expect(font.headers.get('cache-control')).toBe(IMMUTABLE_CACHE_CONTROL)
  })

  it('does not reuse an ETag after a stable URL changes to same-sized content', async () => {
    const root = await createArtifact()
    const server = createStaticArtifactServer(root)
    servers.push(server)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Expected a TCP test server.')
    const origin = `http://127.0.0.1:${address.port}`

    const original = await fetch(`${origin}/`)
    const originalEntityTag = original.headers.get('etag')
    expect(originalEntityTag).toBeTruthy()
    const replacement = '<!doctype html><title>Nusubi</title>'
    expect(Buffer.byteLength(replacement)).toBe(Buffer.byteLength(await original.text()))
    await writeFile(join(root, 'index.html'), replacement)

    const changed = await fetch(`${origin}/`, {
      headers: { 'if-none-match': originalEntityTag },
    })
    expect(changed.status).toBe(200)
    expect(changed.headers.get('etag')).not.toBe(originalEntityTag)
    await expect(changed.text()).resolves.toBe(replacement)
  })
})

async function createArtifact() {
  const root = await mkdtemp(join(tmpdir(), 'musubi-static-server-'))
  temporaryDirectories.push(root)
  await mkdir(join(root, '_musubi/generated/fonts'), { recursive: true })
  await writeFile(join(root, 'index.html'), '<!doctype html><title>Musubi</title>')
  await writeFile(
    join(root, '404.html'),
    '<!doctype html><title>Page not found</title><a href="/">Home</a>',
  )
  await writeFile(
    join(root, '_musubi/generated/fonts/Tsanger-JinKai-W04-subset-0123456789abcdef.woff2'),
    'generated subset',
  )
  return root
}