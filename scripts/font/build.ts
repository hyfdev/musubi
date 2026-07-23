import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadSiteFromSnapshot } from '../../src/server/site/get-site.ts'
import { buildPublicFonts, type FontBuildManifest } from './build-fonts.ts'
import { createPublicFontCorpora } from './corpus.ts'
import { latinFontCacheDirectory } from './latin-fonts.ts'
import { tsangerFontCacheDirectory } from './tsanger-fonts.ts'

const generatedPublicDirectory = resolve('public/_musubi/generated')
const fontBuildStatePath = resolve('.musubi/font/build-state.json')
const FONT_BUILD_STATE_VERSION = 2

interface FontBuildState {
  schemaVersion: typeof FONT_BUILD_STATE_VERSION
  inputFingerprint: string
  outputs: Record<string, string>
}

interface FontBuildFingerprintOptions {
  root?: string
  environment?: NodeJS.ProcessEnv
  tsangerCachePath?: string
  latinCachePath?: string
}

export const FONT_BUILD_REPOSITORY_INPUTS = [
  '.musubi/notion-data-snapshot',
  'licenses/fonts',
  'package.json',
  'pnpm-lock.yaml',
  'scripts/font',
  'src/server/site',
  'src/shared/chinese-typography.ts',
  'src/shared/content',
  'src/shared/notion-data',
  'src/shared/site',
] as const

async function writeFontCss(fonts: FontBuildManifest): Promise<void> {
  const face = (
    family: string,
    weight: string | number,
    style: 'normal' | 'italic',
    artifact: NonNullable<FontBuildManifest['artifacts']['tsangerW04']>,
  ): string => {
    return `@font-face {\n  font-family: '${family}';\n  src: url('/_musubi/generated/${artifact.path}') format('woff2');\n  font-display: swap;\n  font-style: ${style};\n  font-weight: ${weight};\n  unicode-range: ${artifact.coverage.cssUnicodeRange};\n}`
  }
  const faces = [
    ...fonts.artifacts.charter.map((artifact) =>
      face('Charter', artifact.weight, artifact.style, artifact),
    ),
    ...fonts.artifacts.jetbrainsMono.map((artifact) =>
      face('JetBrains Mono', artifact.weight, artifact.style, artifact),
    ),
    fonts.artifacts.tsangerW04
      ? face('Tsanger JinKai W04', 400, 'normal', fonts.artifacts.tsangerW04)
      : null,
    fonts.artifacts.tsangerW05
      ? face('Tsanger JinKai W05', 500, 'normal', fonts.artifacts.tsangerW05)
      : null,
    ...fonts.artifacts.fallbackShards.map((artifact) =>
      face('Musubi CJK Fallback', '400 500', 'normal', artifact),
    ),
  ].filter((face): face is string => face !== null)
  const css = `${faces.join('\n\n')}\n`
  const path = resolve(generatedPublicDirectory, `fonts/fonts-${hashBytes(css).slice(0, 16)}.css`)
  await writeFile(path, css)
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

export async function fontBuildInputFingerprint(
  options: FontBuildFingerprintOptions = {},
): Promise<string> {
  const hash = createHash('sha256')
  hash.update(`musubi-font-build:${FONT_BUILD_STATE_VERSION}\0`)
  const root = options.root ?? resolve()
  for (const input of FONT_BUILD_REPOSITORY_INPUTS) {
    await fingerprintPath(hash, resolve(root, input), input)
  }

  const environment = options.environment ?? process.env
  const environmentInputs = [
    ['MUSUBI_TSANGER_W04_PATH', environment.MUSUBI_TSANGER_W04_PATH?.trim()],
    ['MUSUBI_TSANGER_W05_PATH', environment.MUSUBI_TSANGER_W05_PATH?.trim()],
  ] as const
  for (const [name, path] of environmentInputs) {
    hash.update(`${name}\0${path ?? 'unset'}\0`)
    if (path) await fingerprintPath(hash, resolve(root, path), name)
  }
  await fingerprintPath(
    hash,
    options.tsangerCachePath ?? tsangerFontCacheDirectory(),
    'Tsanger setup cache',
  )
  await fingerprintPath(
    hash,
    options.latinCachePath ?? latinFontCacheDirectory(),
    'Latin webfont setup cache',
  )
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
  const fonts = await buildPublicFonts(createPublicFontCorpora(site), generatedPublicDirectory)
  await writeFontCss(fonts)
  await writeFontBuildState(inputFingerprint)
  console.log(
    `Fonts ready for ${site.posts.length + site.pages.length + (site.home ? 1 : 0)} Published pages (${fonts.artifacts.fallbackShards.length} runtime fallback shards).`,
  )
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}