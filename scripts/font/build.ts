import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

import { extractTypographyCorpora } from '../../shared/content/corpus.ts'
import { formatPublishedDate } from '../../shared/site/format.ts'
import type { Site } from '../../shared/site/types.ts'
import { loadSiteFromSnapshot } from '../../server/site/get-site.ts'
import { buildPublicFonts, type FontBuildManifest, type FontCorpora } from './build-fonts.ts'
import { tsangerFontCacheDirectory } from './tsanger-fonts.ts'

const generatedPublicDirectory = resolve('public/_musubi/generated')
const fontBuildStatePath = resolve('.musubi/font/build-state.json')
const FONT_BUILD_STATE_VERSION = 1

interface FontBuildState {
  schemaVersion: typeof FONT_BUILD_STATE_VERSION
  inputFingerprint: string
  outputs: Record<string, string>
}

const applicationText = [
  'Home',
  'Blog',
  'Table of contents',
  'Referenced X post',
  'Read the post on X',
  'Theme',
  'System',
  'Light',
  'Dark',
  'Copy',
  'Copied',
  'Copy failed',
  'Back to Blog',
  'Note',
  'Warning',
  'Error',
  'Page not found',
  'The page you requested does not exist or is not published.',
  'Back to Home',
  'No posts have been published yet.',
  'Built with Musubi',
  '·',
  '—',
].join('\n')

function publicCorpora(site: Site): FontCorpora {
  const contents = [...site.posts, ...site.pages]
  const configText = Object.values(site.config).join('\n')
  const navigationText = site.navigation.map((item) => item.title).join('\n')
  const typography = contents.map((page) => extractTypographyCorpora(page.document))
  const metadataText = contents
    .flatMap((page) => [page.title, page.description, ...page.tags])
    .join('\n')
  const titleText = contents.map((page) => page.title).join('\n')
  const renderedDates = site.posts
    .map((page) => formatPublishedDate(page.date, site.config))
    .join('\n')
  return {
    body: [
      applicationText,
      configText,
      navigationText,
      metadataText,
      renderedDates,
      ...typography.map((corpus) => corpus.body),
    ]
      .join('\n')
      .normalize('NFC'),
    emphasis: [titleText, ...typography.map((corpus) => corpus.emphasis)]
      .join('\n')
      .normalize('NFC'),
  }
}

async function writeFontCss(fonts: FontBuildManifest): Promise<void> {
  const tsangerFace = (
    family: string,
    weight: number,
    artifact: FontBuildManifest['artifacts']['tsangerW04'],
  ): string | null => {
    if (!artifact) return null
    return `@font-face {\n  font-family: '${family}';\n  src: url('/_musubi/generated/${artifact.path}') format('woff2');\n  font-display: swap;\n  font-style: normal;\n  font-weight: ${weight};\n  unicode-range: ${artifact.coverage.cssUnicodeRange};\n}`
  }
  const faces = [
    tsangerFace('Tsanger JinKai W04', 400, fonts.artifacts.tsangerW04),
    tsangerFace('Tsanger JinKai W05', 500, fonts.artifacts.tsangerW05),
    ...fonts.artifacts.fallbackShards.map(
      (artifact) =>
        `@font-face {\n  font-family: 'Musubi CJK Fallback';\n  src: url('/_musubi/generated/${artifact.path}') format('woff2');\n  font-display: swap;\n  font-style: normal;\n  font-weight: 400 500;\n  unicode-range: ${artifact.coverage.cssUnicodeRange};\n}`,
    ),
  ].filter((face): face is string => face !== null)
  await writeFile(resolve(generatedPublicDirectory, 'fonts/fonts.css'), `${faces.join('\n\n')}\n`)
}

function hashBytes(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

async function fingerprintPath(
  hash: ReturnType<typeof createHash>,
  path: string,
  label: string,
): Promise<void> {
  const info = await lstat(path).catch(() => undefined)
  if (!info) {
    hash.update(`${label}\0missing\0`)
    return
  }
  if (info.isSymbolicLink()) {
    hash.update(`${label}\0symlink\0`)
    return
  }
  if (info.isFile()) {
    hash.update(`${label}\0file\0`)
    hash.update(await readFile(path))
    return
  }
  if (!info.isDirectory()) {
    hash.update(`${label}\0other\0`)
    return
  }
  hash.update(`${label}\0directory\0`)
  const entries = (await readdir(path, { withFileTypes: true })).sort((left, right) =>
    left.name.localeCompare(right.name, 'en'),
  )
  for (const entry of entries) {
    await fingerprintPath(hash, join(path, entry.name), `${label}/${entry.name}`)
  }
}

async function fontBuildInputFingerprint(): Promise<string> {
  const hash = createHash('sha256')
  hash.update(`musubi-font-build:${FONT_BUILD_STATE_VERSION}\0`)
  const repositoryInputs = [
    '.musubi/notion-data-snapshot',
    'licenses/fonts/OFL-LXGW-WenKai-GB.txt',
    'package.json',
    'pnpm-lock.yaml',
    'scripts/font',
    'server/site',
    'shared/content',
    'shared/site',
  ]
  for (const input of repositoryInputs) {
    await fingerprintPath(hash, resolve(input), input)
  }

  const environmentInputs = [
    ['MUSUBI_TSANGER_W04_PATH', process.env.MUSUBI_TSANGER_W04_PATH?.trim()],
    ['MUSUBI_TSANGER_W05_PATH', process.env.MUSUBI_TSANGER_W05_PATH?.trim()],
  ] as const
  for (const [name, path] of environmentInputs) {
    hash.update(`${name}\0${path ?? 'unset'}\0`)
    if (path) await fingerprintPath(hash, resolve(path), name)
  }
  await fingerprintPath(hash, tsangerFontCacheDirectory(), 'Tsanger setup cache')
  return hash.digest('hex')
}

async function generatedOutputHashes(): Promise<Record<string, string>> {
  const outputs: Record<string, string> = {}
  const visit = async (directory: string): Promise<void> => {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) {
        const output = relative(generatedPublicDirectory, path).replaceAll('\\', '/')
        outputs[output] = hashBytes(await readFile(path))
      }
    }
  }
  await visit(generatedPublicDirectory)
  return outputs
}

async function canReuseGeneratedFonts(inputFingerprint: string): Promise<boolean> {
  const state = await readFile(fontBuildStatePath, 'utf8')
    .then((source) => JSON.parse(source) as FontBuildState)
    .catch(() => undefined)
  if (
    !state ||
    state.schemaVersion !== FONT_BUILD_STATE_VERSION ||
    state.inputFingerprint !== inputFingerprint
  ) {
    return false
  }
  const outputs = await generatedOutputHashes()
  return JSON.stringify(outputs) === JSON.stringify(state.outputs)
}

async function writeFontBuildState(inputFingerprint: string): Promise<void> {
  const state: FontBuildState = {
    schemaVersion: FONT_BUILD_STATE_VERSION,
    inputFingerprint,
    outputs: await generatedOutputHashes(),
  }
  await mkdir(dirname(fontBuildStatePath), { recursive: true })
  const temporaryPath = `${fontBuildStatePath}.${process.pid}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  await rename(temporaryPath, fontBuildStatePath)
}

async function main(): Promise<void> {
  const inputFingerprint = await fontBuildInputFingerprint()
  if (await canReuseGeneratedFonts(inputFingerprint)) {
    console.log('Fonts unchanged; using the existing generated files.')
    return
  }
  const site = await loadSiteFromSnapshot()
  await rm(generatedPublicDirectory, { recursive: true, force: true })
  await mkdir(generatedPublicDirectory, { recursive: true })
  const fonts = await buildPublicFonts(publicCorpora(site), generatedPublicDirectory)
  await writeFontCss(fonts)
  await writeFontBuildState(inputFingerprint)
  console.log(
    `Fonts ready for ${site.posts.length + site.pages.length} Published pages (${fonts.artifacts.fallbackShards.length} fallback shards).`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})