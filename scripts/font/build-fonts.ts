import { createHash } from 'node:crypto'
import { chmod, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename, dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFont, woff2 } from 'fonteditor-core'
import subsetFont from 'subset-font'
import {
  classifyChineseTypographyText,
  type ChineseTypographyCategory,
} from '../../shared/chinese-typography.ts'
import {
  inspectLatinFontCache,
  LATIN_FONT_SOURCES,
  type LatinFontSourceKey,
} from './latin-fonts.ts'
import { inspectTsangerFontCache } from './tsanger-fonts.ts'

const require = createRequire(import.meta.url)
const PREBUILT_FALLBACK_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), 'prebuilt-fallback')
const PREBUILT_FALLBACK_MANIFEST = 'fonts-manifest.json'
const PREBUILT_FALLBACK_MANIFEST_SHA256 =
  '28176676c917e2a8bf54b74c1d2bf765649eab3b80f97c6e238e025c9a8a2d21'

const LXGW_SOURCE = {
  repository: 'https://github.com/lxgw/LxgwWenKaiGB',
  release: 'v1.522',
  asset: 'LXGWWenKaiGB-Medium.ttf',
  url: 'https://github.com/lxgw/LxgwWenKaiGB/releases/download/v1.522/LXGWWenKaiGB-Medium.ttf',
  sha256: 'b885c51ec0d3f325974013801dfcefda1a9ba0bf385c607cf5f2582dafa2e5ab',
  fileName: 'LXGWWenKaiGB-Medium.ttf',
} as const

const TOOL_VERSIONS = {
  subsetFont: '2.5.0',
  fonteditorCore: '2.6.3',
} as const

const OUTPUT_PATHS = {
  manifest: 'fonts/fonts-manifest.json',
  fallbackLicense: 'fonts/OFL-Musubi-CJK-Fallback.txt',
  charterLicense: 'fonts/LICENSE-Charter.txt',
  jetbrainsMonoLicense: 'fonts/OFL-JetBrains-Mono.txt',
} as const

const TSANGER_OUTPUT_NAMES = {
  w04: 'Tsanger-JinKai-W04-subset',
  w05: 'Tsanger-JinKai-W05-subset',
} as const

const FALLBACK_LICENSE = {
  path: 'licenses/fonts/OFL-Musubi-CJK-Fallback.txt',
  sha256: '66e75815b1bb90bdaede3649abf5ea029d0dc7d5e61b0534d3245db61a510b93',
} as const

const CHARTER_LICENSE = {
  path: 'licenses/fonts/Charter.txt',
  sha256: 'e1681af74192c99114a60708a2b16e5c24b8bd1347d7ef8e2703a76f19aa59e7',
} as const

const JETBRAINS_MONO_LICENSE = {
  path: 'licenses/fonts/OFL-JetBrains-Mono.txt',
  sha256: '5988080cac27ec76c0250e04eebda4c5889378ec9843633bd71a351f14bb80ee',
} as const

const FALLBACK_FAMILY = 'Musubi CJK Fallback'
const FALLBACK_POSTSCRIPT_NAME = 'Musubi-CJK-Fallback'
const FALLBACK_UNIQUE_NAME = 'Musubi CJK Fallback Medium'
const RESERVED_FONT_NAME_PATTERN = /LXGW\s*WenKai|LXGWWenKai/iu
const PRESERVED_NAME_IDS = Array.from({ length: 26 }, (_, index) => index)

const FALLBACK_SHARDS = [
  { id: 'punctuation', maximum: 0x33ff },
  { id: 'extension-a', maximum: 0x4dbf },
  { id: 'unified-1', maximum: 0x61ff },
  { id: 'unified-2', maximum: 0x75ff },
  { id: 'unified-3', maximum: 0x89ff },
  { id: 'unified-4', maximum: 0x9fff },
  { id: 'compatibility', maximum: 0xffff },
  { id: 'supplementary', maximum: Number.POSITIVE_INFINITY },
] as const

export interface FontCorpora {
  text: string
  code: string
}

export interface UnicodeCoverage {
  count: number
  codePoints: string[]
  ranges: string[]
  cssUnicodeRange: string
}

export interface FontArtifact {
  path: string
  family: string
  bytes: number
  sha256: string
  coverage: UnicodeCoverage
}

export interface StyledFontArtifact extends FontArtifact {
  style: 'normal' | 'italic'
  weight: 400 | 700
}

export interface FontBuildManifest {
  schemaVersion: 4
  familyStack: {
    body: readonly ['Tsanger JinKai W04', 'Musubi CJK Fallback']
    emphasis: readonly ['Tsanger JinKai W05', 'Musubi CJK Fallback']
  }
  tools: {
    subsetFont: string
    fonteditorCore: string
  }
  sources: {
    tsanger: {
      mode: 'environment' | 'setup-cache' | 'absent'
      w04: { bytes: number; sha256: string } | null
      w05: { bytes: number; sha256: string } | null
    }
    fallback: {
      repository: string
      release: string
      asset: string
      url: string
      bytes: number
      sha256: string
      cmapCodePointCount: number
    }
    latin: Record<
      LatinFontSourceKey,
      {
        family: 'Charter' | 'JetBrains Mono'
        style: 'normal' | 'italic'
        weight: 400 | 700
        url: string
        bytes: number
        sha256: string
      }
    >
  }
  selectedCorpora: {
    chinese: UnicodeCoverage
    latin: UnicodeCoverage
    code: UnicodeCoverage
  }
  artifacts: {
    charter: StyledFontArtifact[]
    jetbrainsMono: StyledFontArtifact[]
    tsangerW04: FontArtifact | null
    tsangerW05: FontArtifact | null
    fallbackShards: FontArtifact[]
    manifestPath: string
  }
  licenses: {
    fallback: { path: string; sha256: string }
    charter: { path: string; sha256: string }
    jetbrainsMono: { path: string; sha256: string }
  }
}

interface PrebuiltFallbackManifest {
  schemaVersion: 3
  familyStack: {
    body: readonly ['Tsanger JinKai W04', 'Musubi CJK Fallback']
    emphasis: readonly ['Tsanger JinKai W05', 'Musubi CJK Fallback']
  }
  tools: FontBuildManifest['tools']
  sources: {
    tsanger: {
      mode: 'absent'
      w04: null
      w05: null
    }
    fallback: FontBuildManifest['sources']['fallback']
  }
  selectedCorpora: {
    body: UnicodeCoverage
    emphasis: UnicodeCoverage
  }
  artifacts: {
    tsangerW04: null
    tsangerW05: null
    fallbackShards: FontArtifact[]
    manifestPath: string
  }
  licenses: { fallback: { path: string; sha256: string } }
}

interface CachedSource {
  buffer: Buffer
  bytes: number
}

interface LocalTsangerSources {
  mode: 'environment' | 'setup-cache'
  w04: CachedSource & { sha256: string }
  w05: CachedSource & { sha256: string }
}

interface LocalLatinSource extends CachedSource {
  sha256: string
}

type LocalLatinSources = Record<LatinFontSourceKey, LocalLatinSource>

interface ParsedNameRecord {
  platformId: number
  encodingId: number
  languageId: number
  nameId: number
  value: string
}

export async function buildPublicFonts(
  corpora: FontCorpora,
  generatedPublicDirectory: string,
): Promise<FontBuildManifest> {
  if (typeof corpora.text !== 'string' || typeof corpora.code !== 'string') {
    throw new TypeError('The public font corpora must contain text and code strings.')
  }
  if (typeof generatedPublicDirectory !== 'string' || generatedPublicDirectory.trim() === '') {
    throw new TypeError('The generated public directory must be a nonempty path.')
  }

  const outputRoot = resolve(generatedPublicDirectory)
  await mkdir(join(outputRoot, 'fonts'), { recursive: true })
  await assertToolVersion('subset-font', TOOL_VERSIONS.subsetFont)
  await assertToolVersion('fonteditor-core', TOOL_VERSIONS.fonteditorCore)
  await woff2.init()
  const prebuiltFallback = await readPrebuiltFallbackManifest()
  await installFontLicenses(outputRoot)
  const tsangerSources = await loadLocalTsangerSources()
  const latinSources = await loadLocalLatinSources()
  const chinese = collectChineseTypographyCodePoints(`${corpora.text}\n${corpora.code}`)
  const latin = collectNonChineseTypographyCodePoints(corpora.text)
  const code = collectNonChineseTypographyCodePoints(corpora.code)

  console.log(
    tsangerSources
      ? `Chinese typography source: Tsanger JinKai W04/W05 (${tsangerSources.mode}).`
      : 'Chinese typography source: Musubi CJK Fallback (optional Tsanger setup not active).',
  )
  let tsangerW04: FontArtifact | null = null
  let tsangerW05: FontArtifact | null = null
  await removeTsangerOutputs(outputRoot)
  if (tsangerSources) {
    tsangerW04 = await buildTsangerSubset(
      tsangerSources.w04.buffer,
      chinese.codePoints,
      TSANGER_OUTPUT_NAMES.w04,
      'Tsanger JinKai W04',
      outputRoot,
    )
    tsangerW05 = await buildTsangerSubset(
      tsangerSources.w05.buffer,
      chinese.codePoints,
      TSANGER_OUTPUT_NAMES.w05,
      'Tsanger JinKai W05',
      outputRoot,
    )
  }

  const tsangerW04Cmap = tsangerSources ? readCmap(tsangerSources.w04.buffer, 'ttf') : null
  const tsangerW05Cmap = tsangerSources ? readCmap(tsangerSources.w05.buffer, 'ttf') : null
  const fallbackCodePoints = chinese.codePoints.filter(
    (codePoint) =>
      !tsangerW04Cmap ||
      !tsangerW05Cmap ||
      !tsangerW04Cmap.has(codePoint) ||
      !tsangerW05Cmap.has(codePoint),
  )
  const unavailable = fallbackCodePoints.filter(
    (codePoint) =>
      !prebuiltFallback.artifacts.fallbackShards.some((artifact) =>
        coverageContains(artifact.coverage, codePoint),
      ),
  )
  if (unavailable.length > 0) {
    throw new Error(
      `Required Chinese typography code points are absent from Tsanger and LXGW: ${formatCodePoints(unavailable).join(', ')}`,
    )
  }
  const fallbackShards = await buildFallbackSubsets(
    prebuiltFallback.artifacts.fallbackShards,
    fallbackCodePoints,
    outputRoot,
  )
  const charter = await buildStyledFontSubsets(
    latinSources,
    'Charter',
    latin.codePoints,
    outputRoot,
  )
  const jetbrainsMono = await buildStyledFontSubsets(
    latinSources,
    'JetBrains Mono',
    code.codePoints,
    outputRoot,
  )

  const manifest: FontBuildManifest = {
    schemaVersion: 4,
    familyStack: {
      body: ['Tsanger JinKai W04', 'Musubi CJK Fallback'],
      emphasis: ['Tsanger JinKai W05', 'Musubi CJK Fallback'],
    },
    tools: {
      subsetFont: TOOL_VERSIONS.subsetFont,
      fonteditorCore: TOOL_VERSIONS.fonteditorCore,
    },
    sources: {
      tsanger: {
        mode: tsangerSources?.mode ?? 'absent',
        w04: tsangerSources
          ? { bytes: tsangerSources.w04.bytes, sha256: tsangerSources.w04.sha256 }
          : null,
        w05: tsangerSources
          ? { bytes: tsangerSources.w05.bytes, sha256: tsangerSources.w05.sha256 }
          : null,
      },
      fallback: {
        ...prebuiltFallback.sources.fallback,
      },
      latin: Object.fromEntries(
        Object.entries(LATIN_FONT_SOURCES).map(([key, source]) => [
          key,
          {
            family: source.family,
            style: source.style,
            weight: source.weight,
            url: source.url,
            bytes: source.bytes,
            sha256: source.sha256,
          },
        ]),
      ) as FontBuildManifest['sources']['latin'],
    },
    selectedCorpora: {
      chinese: createCoverage(chinese.codePoints),
      latin: createCoverage(latin.codePoints),
      code: createCoverage(code.codePoints),
    },
    artifacts: {
      charter,
      jetbrainsMono,
      tsangerW04,
      tsangerW05,
      fallbackShards,
      manifestPath: OUTPUT_PATHS.manifest,
    },
    licenses: {
      fallback: {
        path: OUTPUT_PATHS.fallbackLicense,
        sha256: FALLBACK_LICENSE.sha256,
      },
      charter: {
        path: OUTPUT_PATHS.charterLicense,
        sha256: CHARTER_LICENSE.sha256,
      },
      jetbrainsMono: {
        path: OUTPUT_PATHS.jetbrainsMonoLicense,
        sha256: JETBRAINS_MONO_LICENSE.sha256,
      },
    },
  }

  await writeAtomic(
    join(outputRoot, OUTPUT_PATHS.manifest),
    `${JSON.stringify(manifest, null, 2)}\n`,
    0o644,
  )
  return manifest
}

async function installFontLicenses(outputRoot: string): Promise<void> {
  for (const [source, outputPath] of [
    [FALLBACK_LICENSE, OUTPUT_PATHS.fallbackLicense],
    [CHARTER_LICENSE, OUTPUT_PATHS.charterLicense],
    [JETBRAINS_MONO_LICENSE, OUTPUT_PATHS.jetbrainsMonoLicense],
  ] as const) {
    await writeAtomic(
      resolve(outputRoot, outputPath),
      await readVerifiedRepositoryFile(source),
      0o644,
    )
  }
}

async function readPrebuiltFallbackManifest(): Promise<PrebuiltFallbackManifest> {
  const manifestBytes = await readFile(checkedPrebuiltPath(PREBUILT_FALLBACK_MANIFEST))
  if (sha256(manifestBytes) !== PREBUILT_FALLBACK_MANIFEST_SHA256) {
    throw new Error(
      'The checked-in fallback font manifest changed without updating its reviewed checksum.',
    )
  }
  const manifest = JSON.parse(manifestBytes.toString('utf8')) as PrebuiltFallbackManifest
  if (
    manifest.schemaVersion !== 3 ||
    manifest.tools.subsetFont !== TOOL_VERSIONS.subsetFont ||
    manifest.tools.fonteditorCore !== TOOL_VERSIONS.fonteditorCore ||
    manifest.sources.fallback.release !== LXGW_SOURCE.release ||
    manifest.sources.fallback.asset !== LXGW_SOURCE.asset ||
    manifest.sources.fallback.url !== LXGW_SOURCE.url ||
    manifest.sources.fallback.sha256 !== LXGW_SOURCE.sha256 ||
    manifest.licenses.fallback.path !== OUTPUT_PATHS.fallbackLicense ||
    manifest.licenses.fallback.sha256 !== FALLBACK_LICENSE.sha256 ||
    manifest.artifacts.tsangerW04 !== null ||
    manifest.artifacts.tsangerW05 !== null ||
    manifest.artifacts.fallbackShards.length !== FALLBACK_SHARDS.length
  ) {
    throw new Error('The checked-in fallback font manifest does not match this Musubi version.')
  }

  for (const artifact of manifest.artifacts.fallbackShards) {
    if (
      artifact.family !== FALLBACK_FAMILY ||
      artifact.coverage.count <= 0 ||
      artifact.coverage.ranges.length === 0 ||
      artifact.coverage.cssUnicodeRange !== artifact.coverage.ranges.join(', ')
    ) {
      throw new Error(`Checked-in fallback font coverage is invalid: ${artifact.path}`)
    }
    for (const range of artifact.coverage.ranges) parseCoverageRange(range)
  }
  return manifest
}

function checkedPrebuiltPath(relativePath: string): string {
  const canonicalPath = checkedPrebuiltRelativePath(relativePath)
  const path = resolve(PREBUILT_FALLBACK_ROOT, canonicalPath)
  if (path !== PREBUILT_FALLBACK_ROOT && !path.startsWith(`${PREBUILT_FALLBACK_ROOT}${sep}`)) {
    throw new Error(`Checked-in fallback font path escapes its directory: ${relativePath}`)
  }
  return path
}

function checkedPrebuiltRelativePath(relativePath: string): string {
  if (
    relativePath.length === 0 ||
    relativePath.startsWith('/') ||
    relativePath.includes('\\') ||
    relativePath.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error(`Checked-in fallback font path is not canonical: ${relativePath}`)
  }
  return relativePath
}

function coverageContains(coverage: UnicodeCoverage, codePoint: number): boolean {
  return coverage.ranges.some((range) => {
    const [start, end] = parseCoverageRange(range)
    return codePoint >= start && codePoint <= end
  })
}

function parseCoverageRange(range: string): readonly [number, number] {
  const match = /^U\+([0-9A-F]{4,6})(?:-([0-9A-F]{4,6}))?$/u.exec(range)
  if (!match) throw new Error(`Checked-in fallback font contains an invalid range: ${range}`)
  const start = Number.parseInt(match[1]!, 16)
  const end = match[2] ? Number.parseInt(match[2], 16) : start
  if (start > end || end > 0x10ffff) {
    throw new Error(`Checked-in fallback font contains an invalid range: ${range}`)
  }
  return [start, end]
}

export async function verifyPrebuiltFallbackCoverage(): Promise<void> {
  const manifest = await readPrebuiltFallbackManifest()
  await woff2.init()
  const combined = new Set<number>()
  for (const artifact of manifest.artifacts.fallbackShards) {
    const buffer = await readFile(checkedPrebuiltPath(artifact.path))
    if (buffer.length !== artifact.bytes || sha256(buffer) !== artifact.sha256) {
      throw new Error(`Checked-in fallback font artifact failed verification: ${artifact.path}`)
    }
    const actual = [...readCmap(buffer, 'woff2')].sort((left, right) => left - right)
    const declared = expandCoverage(artifact.coverage)
    if (!sameNumbers(actual, declared)) {
      throw new Error(`Checked-in fallback cmap differs from its manifest: ${artifact.path}`)
    }
    for (const codePoint of actual) {
      if (combined.has(codePoint)) {
        throw new Error(`Checked-in fallback shards overlap at ${formatCodePoint(codePoint)}.`)
      }
      combined.add(codePoint)
    }
  }
  if (combined.size !== manifest.sources.fallback.cmapCodePointCount) {
    throw new Error(
      `Checked-in fallback cmap has ${combined.size} code points; expected ${manifest.sources.fallback.cmapCodePointCount}.`,
    )
  }
}

function expandCoverage(coverage: UnicodeCoverage): number[] {
  const codePoints = new Set<number>()
  for (const range of coverage.ranges) {
    const [start, end] = parseCoverageRange(range)
    for (let codePoint = start; codePoint <= end; codePoint += 1) codePoints.add(codePoint)
  }
  const expanded = [...codePoints].sort((left, right) => left - right)
  if (expanded.length !== coverage.count) {
    throw new Error(
      `Checked-in fallback coverage declares ${coverage.count} code points but expands to ${expanded.length}.`,
    )
  }
  return expanded
}

export async function rebuildPrebuiltFallback(): Promise<void> {
  await assertToolVersion('subset-font', TOOL_VERSIONS.subsetFont)
  await assertToolVersion('fonteditor-core', TOOL_VERSIONS.fonteditorCore)
  await woff2.init()

  const temporaryRoot = `${PREBUILT_FALLBACK_ROOT}.${process.pid}.tmp`
  await rm(temporaryRoot, { recursive: true, force: true })
  await mkdir(join(temporaryRoot, 'fonts'), { recursive: true })
  try {
    const fallbackLicense = await readVerifiedRepositoryFile(FALLBACK_LICENSE)
    await writeAtomic(join(temporaryRoot, OUTPUT_PATHS.fallbackLicense), fallbackLicense, 0o644)

    const fallbackSource = await loadCachedSource(LXGW_SOURCE)
    const fallbackCmap = readCmap(fallbackSource.buffer, 'ttf')
    const fallbackCodePoints = [...fallbackCmap].sort((left, right) => left - right)
    const fallbackShards = await buildFallbackShards(
      fallbackSource.buffer,
      fallbackCodePoints,
      temporaryRoot,
    )
    const manifest: PrebuiltFallbackManifest = {
      schemaVersion: 3,
      familyStack: {
        body: ['Tsanger JinKai W04', 'Musubi CJK Fallback'],
        emphasis: ['Tsanger JinKai W05', 'Musubi CJK Fallback'],
      },
      tools: {
        subsetFont: TOOL_VERSIONS.subsetFont,
        fonteditorCore: TOOL_VERSIONS.fonteditorCore,
      },
      sources: {
        tsanger: { mode: 'absent', w04: null, w05: null },
        fallback: {
          repository: LXGW_SOURCE.repository,
          release: LXGW_SOURCE.release,
          asset: LXGW_SOURCE.asset,
          url: LXGW_SOURCE.url,
          bytes: fallbackSource.bytes,
          sha256: LXGW_SOURCE.sha256,
          cmapCodePointCount: fallbackCmap.size,
        },
      },
      selectedCorpora: {
        body: createCoverage([]),
        emphasis: createCoverage([]),
      },
      artifacts: {
        tsangerW04: null,
        tsangerW05: null,
        fallbackShards,
        manifestPath: PREBUILT_FALLBACK_MANIFEST,
      },
      licenses: {
        fallback: {
          path: OUTPUT_PATHS.fallbackLicense,
          sha256: FALLBACK_LICENSE.sha256,
        },
      },
    }
    await writeAtomic(
      join(temporaryRoot, PREBUILT_FALLBACK_MANIFEST),
      `${JSON.stringify(manifest, null, 2)}\n`,
      0o644,
    )
    await rm(PREBUILT_FALLBACK_ROOT, { recursive: true, force: true })
    await rename(temporaryRoot, PREBUILT_FALLBACK_ROOT)
  } catch (error) {
    await rm(temporaryRoot, { recursive: true, force: true })
    throw error
  }
  console.log('Rebuilt the checked-in Musubi CJK fallback font bundle.')
}

async function loadLocalTsangerSources(): Promise<LocalTsangerSources | null> {
  const w04Path = process.env.MUSUBI_TSANGER_W04_PATH?.trim()
  const w05Path = process.env.MUSUBI_TSANGER_W05_PATH?.trim()
  if (!w04Path || !w05Path) {
    if (!w04Path && !w05Path) {
      const cached = await inspectTsangerFontCache()
      if (!cached.w04 && !cached.w05) return null
      if (!cached.w04 || !cached.w05) {
        throw new Error(
          `The optional Tsanger JinKai cache in ${cached.directory} is incomplete; rerun "vp run font:setup" or clear it with "vp run font:setup -- --clear".`,
        )
      }
      readCmap(cached.w04.buffer, 'ttf')
      readCmap(cached.w05.buffer, 'ttf')
      return {
        mode: 'setup-cache',
        w04: cached.w04,
        w05: cached.w05,
      }
    }
    throw new Error(
      'MUSUBI_TSANGER_W04_PATH and MUSUBI_TSANGER_W05_PATH must be provided together.',
    )
  }

  const [w04, w05] = await Promise.all([readFile(resolve(w04Path)), readFile(resolve(w05Path))])
  readCmap(w04, 'ttf')
  readCmap(w05, 'ttf')
  validateTsangerIdentity(w04, 'W04', w04Path)
  validateTsangerIdentity(w05, 'W05', w05Path)
  const w04Sha256 = sha256(w04)
  const w05Sha256 = sha256(w05)
  if (w04Sha256 === w05Sha256) {
    throw new Error('The W04 and W05 Tsanger source paths resolve to the same font file.')
  }
  return {
    mode: 'environment',
    w04: { buffer: w04, bytes: w04.length, sha256: w04Sha256 },
    w05: { buffer: w05, bytes: w05.length, sha256: w05Sha256 },
  }
}

async function loadLocalLatinSources(): Promise<LocalLatinSources> {
  const cached = await inspectLatinFontCache()
  if (!cached) {
    throw new Error(
      'Charter and JetBrains Mono sources are missing; run "vp run font:setup" before font:build.',
    )
  }
  return Object.fromEntries(
    Object.entries(cached.fonts).map(([key, font]) => [
      key,
      { buffer: font.buffer, bytes: font.bytes, sha256: font.sha256 },
    ]),
  ) as LocalLatinSources
}

function validateTsangerIdentity(
  buffer: Buffer,
  expectedWeight: 'W04' | 'W05',
  path: string,
): void {
  const names = createFont(buffer, { type: 'ttf', compound2simple: false }).get().name
  const identity = [
    names.fontFamily,
    names.preferredFamily,
    names.preferredSubFamily,
    names.postScriptName,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
  if (!/TsangerJinKai02/iu.test(identity) || !new RegExp(expectedWeight, 'u').test(identity)) {
    throw new Error(
      `${path} is not recognizable as Tsanger JinKai 02 ${expectedWeight}; check that the W04 and W05 paths are not swapped.`,
    )
  }
}

async function buildTsangerSubset(
  source: Buffer,
  requestedCodePoints: number[],
  outputName: string,
  family: string,
  outputRoot: string,
): Promise<FontArtifact | null> {
  const sourceCmap = readCmap(source, 'ttf')
  const covered = requestedCodePoints.filter((codePoint) => sourceCmap.has(codePoint))
  if (covered.length === 0) return null
  const buffer = await createPlainSubset(source, covered)
  validateTsangerSubset(buffer, covered, source, sourceCmap)
  const outputPath = `fonts/${outputName}-${sha256(buffer).slice(0, 16)}.woff2`
  await writeAtomic(join(outputRoot, outputPath), buffer, 0o644)
  return createArtifact(outputPath, family, buffer, covered)
}

async function removeTsangerOutputs(outputRoot: string): Promise<void> {
  const fontDirectory = join(outputRoot, 'fonts')
  const entries = await readdir(fontDirectory, { withFileTypes: true })
  const outputPattern = /^Tsanger-JinKai-W0[45]-subset(?:-[0-9a-f]{16})?\.woff2$/u

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && outputPattern.test(entry.name))
      .map((entry) => rm(join(fontDirectory, entry.name), { force: true })),
  )
}

async function buildStyledFontSubsets(
  sources: LocalLatinSources,
  family: 'Charter' | 'JetBrains Mono',
  requestedCodePoints: number[],
  outputRoot: string,
): Promise<StyledFontArtifact[]> {
  const artifacts: StyledFontArtifact[] = []
  for (const [key, sourceMetadata] of Object.entries(LATIN_FONT_SOURCES)) {
    if (sourceMetadata.family !== family) continue
    const source = sources[key as LatinFontSourceKey]
    const sourceCmap = readCmap(source.buffer, 'woff2')
    const covered = requestedCodePoints.filter((codePoint) => sourceCmap.has(codePoint))
    if (covered.length === 0) continue
    const buffer = await createPlainSubset(source.buffer, covered)
    validateExactSubset(
      buffer,
      covered,
      `${family} ${sourceMetadata.weight} ${sourceMetadata.style}`,
    )
    validateLatinFontIdentity(buffer, family)
    const familyName = family.replaceAll(' ', '-')
    const styleName = sourceMetadata.style === 'italic' ? 'Italic' : 'Normal'
    const outputPath = `fonts/${familyName}-${sourceMetadata.weight}-${styleName}-subset-${sha256(buffer).slice(0, 16)}.woff2`
    await writeAtomic(join(outputRoot, outputPath), buffer, 0o644)
    artifacts.push({
      ...createArtifact(outputPath, family, buffer, covered),
      style: sourceMetadata.style,
      weight: sourceMetadata.weight,
    })
  }
  return artifacts
}

async function buildFallbackSubsets(
  prebuiltShards: readonly FontArtifact[],
  requestedCodePoints: number[],
  outputRoot: string,
): Promise<FontArtifact[]> {
  const artifacts: FontArtifact[] = []
  const covered = new Set<number>()
  for (const sourceArtifact of prebuiltShards) {
    const selected = requestedCodePoints.filter((codePoint) =>
      coverageContains(sourceArtifact.coverage, codePoint),
    )
    if (selected.length === 0) continue
    const source = await readFile(checkedPrebuiltPath(sourceArtifact.path))
    if (source.length !== sourceArtifact.bytes || sha256(source) !== sourceArtifact.sha256) {
      throw new Error(
        `Checked-in fallback font artifact failed verification: ${sourceArtifact.path}`,
      )
    }
    const buffer = await createPlainSubset(source, selected)
    validateFallbackFont(buffer, selected)
    const shardId = /^Musubi-CJK-Fallback-(.+)-[0-9a-f]{16}\.woff2$/u.exec(
      basename(sourceArtifact.path),
    )?.[1]
    if (!shardId) throw new Error(`Cannot identify fallback shard: ${sourceArtifact.path}`)
    const outputPath = `fonts/Musubi-CJK-Fallback-${shardId}-subset-${sha256(buffer).slice(0, 16)}.woff2`
    await writeAtomic(join(outputRoot, outputPath), buffer, 0o644)
    artifacts.push(createArtifact(outputPath, FALLBACK_FAMILY, buffer, selected))
    for (const codePoint of selected) covered.add(codePoint)
  }
  const missing = requestedCodePoints.filter((codePoint) => !covered.has(codePoint))
  if (missing.length > 0) {
    throw new Error(`Generated fallback subsets lost ${formatCodePoints(missing).join(', ')}.`)
  }
  return artifacts
}

function validateLatinFontIdentity(buffer: Buffer, expectedFamily: string): void {
  const names = createFont(buffer, { type: 'woff2', compound2simple: false }).get().name
  const family = names.preferredFamily ?? names.fontFamily
  if (family !== expectedFamily) {
    throw new Error(
      `Generated ${expectedFamily} subset reports the family name "${String(family)}".`,
    )
  }
}

async function buildFallbackShards(
  source: Buffer,
  codePoints: number[],
  outputRoot: string,
): Promise<FontArtifact[]> {
  const groups = new Map<string, number[]>()
  for (const codePoint of codePoints) {
    const shard = FALLBACK_SHARDS.find((candidate) => codePoint <= candidate.maximum)!
    const values = groups.get(shard.id) ?? []
    values.push(codePoint)
    groups.set(shard.id, values)
  }

  const artifacts: FontArtifact[] = []
  for (const shard of FALLBACK_SHARDS) {
    const selected = groups.get(shard.id) ?? []
    if (selected.length === 0) continue
    const buffer = await loadOrCreateFallbackShard(source, selected, shard.id)
    validateFallbackFont(buffer, selected)
    const contentHash = sha256(buffer).slice(0, 16)
    const path = `fonts/Musubi-CJK-Fallback-${shard.id}-${contentHash}.woff2`
    await writeAtomic(join(outputRoot, path), buffer, 0o644)
    artifacts.push(createArtifact(path, FALLBACK_FAMILY, buffer, selected, false))
  }
  return artifacts
}

async function loadOrCreateFallbackShard(
  source: Buffer,
  codePoints: number[],
  shardId: string,
): Promise<Buffer> {
  const cacheDirectory = resolve('.musubi', 'font', 'artifacts')
  await mkdir(cacheDirectory, { recursive: true, mode: 0o700 })
  await chmod(cacheDirectory, 0o700)
  const key = sha256(
    Buffer.from(
      [LXGW_SOURCE.sha256, TOOL_VERSIONS.subsetFont, TOOL_VERSIONS.fonteditorCore, shardId].join(
        ':',
      ),
    ),
  )
  const cachePath = join(cacheDirectory, `${key}.woff2`)
  const cached = await readFile(cachePath).catch(() => null)
  if (cached) {
    try {
      validateFallbackFont(cached, codePoints)
      await chmod(cachePath, 0o600)
      return cached
    } catch {
      await rm(cachePath, { force: true })
    }
  }
  const generated = await createFallbackFont(source, codePoints)
  validateFallbackFont(generated, codePoints)
  await writeAtomic(cachePath, generated, 0o600)
  return generated
}

export function collectChineseTypographyCodePoints(corpus: string): {
  codePoints: number[]
  categoryCounts: Record<ChineseTypographyCategory, number>
} {
  const byCodePoint = new Map<number, ChineseTypographyCategory>()
  for (const entry of classifyChineseTypographyText(corpus)) {
    if (entry.category && !byCodePoint.has(entry.codePoint)) {
      byCodePoint.set(entry.codePoint, entry.category)
    }
  }

  const codePoints = [...byCodePoint.keys()].sort((left, right) => left - right)
  const categoryCounts: Record<ChineseTypographyCategory, number> = {
    han: 0,
    cjkPunctuation: 0,
    fullwidth: 0,
    otherChinesePunctuation: 0,
  }
  for (const category of byCodePoint.values()) categoryCounts[category] += 1
  return { codePoints, categoryCounts }
}

function collectNonChineseTypographyCodePoints(corpus: string): { codePoints: number[] } {
  const codePoints = new Set<number>()
  for (const entry of classifyChineseTypographyText(corpus)) {
    if (!entry.cjk && entry.character !== '\n' && entry.character !== '\r') {
      codePoints.add(entry.codePoint)
    }
  }
  return { codePoints: [...codePoints].sort((left, right) => left - right) }
}

async function createPlainSubset(source: Buffer, codePoints: number[]): Promise<Buffer> {
  const subsetText = codePoints.map((codePoint) => String.fromCodePoint(codePoint)).join('')
  return Buffer.from(
    await subsetFont(source, subsetText, {
      targetFormat: 'woff2',
      preserveNameIds: PRESERVED_NAME_IDS,
    }),
  )
}

async function createFallbackFont(source: Buffer, codePoints: number[]): Promise<Buffer> {
  const subset = await createPlainSubset(source, codePoints)
  const parsed = createFont(subset, { type: 'woff2', compound2simple: false })
  const names = parsed.get().name
  const preservedMetadata = {
    copyright: names.copyright,
    licence: names.licence,
    urlOfLicence: names.urlOfLicence,
  }
  if (!preservedMetadata.copyright || !preservedMetadata.licence) {
    throw new Error('The pinned fallback source did not preserve required copyright/OFL metadata.')
  }

  Object.assign(names, {
    fontFamily: FALLBACK_FAMILY,
    fontSubFamily: 'Medium',
    uniqueSubFamily: FALLBACK_UNIQUE_NAME,
    fullName: FALLBACK_UNIQUE_NAME,
    postScriptName: FALLBACK_POSTSCRIPT_NAME,
    preferredFamily: FALLBACK_FAMILY,
    preferredSubFamily: 'Medium',
  })

  const renamedTtf = Buffer.from(parsed.write({ type: 'ttf', toBuffer: true }))
  const renamedWoff2 = Buffer.from(woff2.encode(renamedTtf))
  if (renamedWoff2.length === 0) throw new Error('Fallback WOFF2 encoding produced no data.')

  const validationFont = createFont(renamedWoff2, {
    type: 'woff2',
    compound2simple: false,
  })
  const validatedNames = validationFont.get().name
  for (const [field, value] of Object.entries(preservedMetadata)) {
    if (validatedNames[field] !== value) {
      throw new Error(`Fallback font metadata field "${field}" changed during identity rewriting.`)
    }
  }
  return renamedWoff2
}

function validateSubsetCoverage(buffer: Buffer, requiredCodePoints: number[]): void {
  if (buffer.subarray(0, 4).toString('ascii') !== 'wOF2') {
    throw new Error('Generated font subset is not a structurally recognizable WOFF2 file.')
  }
  const actual = readCmap(buffer, 'woff2')
  const missing = requiredCodePoints.filter((codePoint) => !actual.has(codePoint))
  if (missing.length > 0) {
    throw new Error(`Generated font subset is missing ${formatCodePoints(missing).join(', ')}.`)
  }
}

function validateExactSubset(
  buffer: Buffer,
  requiredCodePoints: number[],
  description: string,
): void {
  validateSubsetCoverage(buffer, requiredCodePoints)
  const actual = [...readCmap(buffer, 'woff2')].sort((left, right) => left - right)
  const expected = [...new Set(requiredCodePoints)].sort((left, right) => left - right)
  if (!sameNumbers(actual, expected)) {
    throw new Error(
      `Generated ${description} subset contains mappings outside its selected corpus.`,
    )
  }
}

function validateTsangerSubset(
  buffer: Buffer,
  requiredCodePoints: number[],
  source: Buffer,
  sourceCmap: Set<number>,
): void {
  validateSubsetCoverage(buffer, requiredCodePoints)
  const actualCodePoints = [...readCmap(buffer, 'woff2')].sort((left, right) => left - right)
  const expectedCodePoints = [...new Set(requiredCodePoints)].sort((left, right) => left - right)
  if (!sameNumbers(actualCodePoints, expectedCodePoints)) {
    const expected = new Set(expectedCodePoints)
    const unexpected = actualCodePoints.filter((codePoint) => !expected.has(codePoint))
    throw new Error(
      `Generated Tsanger subset contains unrequested mappings: ${formatCodePoints(unexpected).join(', ')}.`,
    )
  }

  if (expectedCodePoints.length < sourceCmap.size) {
    const sourceGlyphCount = createFont(source, { type: 'ttf', compound2simple: false }).get().glyf
      .length
    const subsetGlyphCount = createFont(buffer, { type: 'woff2', compound2simple: false }).get()
      .glyf.length
    if (subsetGlyphCount >= sourceGlyphCount) {
      throw new Error(
        `Generated Tsanger subset retained ${subsetGlyphCount} glyphs from a ${sourceGlyphCount}-glyph source.`,
      )
    }
  }
}

function validateFallbackFont(buffer: Buffer, requiredCodePoints: number[]): void {
  validateSubsetCoverage(buffer, requiredCodePoints)
  const font = createFont(buffer, { type: 'woff2', compound2simple: false })
  const actualCodePoints = [...readCmapFromFont(font.get().cmap)].sort(
    (left, right) => left - right,
  )
  if (!sameNumbers(actualCodePoints, requiredCodePoints)) {
    throw new Error(
      `Generated fallback cmap differs from the required set. Required ${requiredCodePoints.length}, received ${actualCodePoints.length}.`,
    )
  }

  const names = font.get().name
  const expectedNames: Record<string, string> = {
    fontFamily: FALLBACK_FAMILY,
    fullName: FALLBACK_UNIQUE_NAME,
    uniqueSubFamily: FALLBACK_UNIQUE_NAME,
    postScriptName: FALLBACK_POSTSCRIPT_NAME,
    preferredFamily: FALLBACK_FAMILY,
  }
  for (const [field, expected] of Object.entries(expectedNames)) {
    if (names[field] !== expected) {
      throw new Error(
        `Generated fallback name "${field}" is "${names[field]}", expected "${expected}".`,
      )
    }
  }
  if (!names.copyright || !names.licence || !/Open Font License/iu.test(names.licence)) {
    throw new Error('Generated fallback is missing its copyright or OFL name metadata.')
  }

  const decodedTtf = Buffer.from(woff2.decode(buffer))
  const nameRecords = parseNameRecords(decodedTtf)
  const identityNameIds = new Set([1, 3, 4, 6, 16, 17, 21, 22])
  for (const record of nameRecords) {
    if (!identityNameIds.has(record.nameId)) continue
    if (RESERVED_FONT_NAME_PATTERN.test(record.value)) {
      throw new Error(
        `Generated fallback retains a Reserved Font Name in name ID ${record.nameId}: "${record.value}".`,
      )
    }
  }
}

function parseNameRecords(ttf: Buffer): ParsedNameRecord[] {
  const view = new DataView(ttf.buffer, ttf.byteOffset, ttf.byteLength)
  const tableCount = view.getUint16(4, false)
  let nameOffset = -1
  let nameLength = 0
  for (let index = 0; index < tableCount; index += 1) {
    const recordOffset = 12 + index * 16
    const tag = ttf.subarray(recordOffset, recordOffset + 4).toString('ascii')
    if (tag === 'name') {
      nameOffset = view.getUint32(recordOffset + 8, false)
      nameLength = view.getUint32(recordOffset + 12, false)
      break
    }
  }
  if (nameOffset < 0 || nameOffset + nameLength > ttf.length) {
    throw new Error('Generated fallback has no valid OpenType name table.')
  }

  const count = view.getUint16(nameOffset + 2, false)
  const stringOffset = view.getUint16(nameOffset + 4, false)
  const records: ParsedNameRecord[] = []
  for (let index = 0; index < count; index += 1) {
    const offset = nameOffset + 6 + index * 12
    const platformId = view.getUint16(offset, false)
    const encodingId = view.getUint16(offset + 2, false)
    const languageId = view.getUint16(offset + 4, false)
    const nameId = view.getUint16(offset + 6, false)
    const length = view.getUint16(offset + 8, false)
    const relativeStringOffset = view.getUint16(offset + 10, false)
    const start = nameOffset + stringOffset + relativeStringOffset
    const end = start + length
    if (start < nameOffset || end > nameOffset + nameLength) {
      throw new Error(
        `Generated fallback contains an invalid name-table string for name ID ${nameId}.`,
      )
    }
    records.push({
      platformId,
      encodingId,
      languageId,
      nameId,
      value: decodeNameRecord(ttf.subarray(start, end), platformId),
    })
  }
  return records
}

function decodeNameRecord(bytes: Buffer, platformId: number): string {
  if (platformId === 0 || platformId === 3) {
    if (bytes.length % 2 !== 0) throw new Error('Invalid UTF-16BE OpenType name record.')
    let result = ''
    for (let index = 0; index < bytes.length; index += 2) {
      result += String.fromCharCode(bytes.readUint16BE(index))
    }
    return result
  }
  try {
    return new TextDecoder('macintosh').decode(bytes)
  } catch {
    return bytes.toString('latin1')
  }
}

function readCmap(buffer: Buffer, type: 'ttf' | 'woff2'): Set<number> {
  const font = createFont(buffer, { type, compound2simple: false })
  return readCmapFromFont(font.get().cmap)
}

function readCmapFromFont(cmap: Record<string, number>): Set<number> {
  return new Set(Object.keys(cmap).map((codePoint) => Number(codePoint)))
}

function createArtifact(
  path: string,
  family: string,
  buffer: Buffer,
  codePoints: number[],
  includeCodePoints = true,
): FontArtifact {
  return {
    path,
    family,
    bytes: buffer.length,
    sha256: sha256(buffer),
    coverage: createCoverage(codePoints, includeCodePoints),
  }
}

function createCoverage(codePoints: number[], includeCodePoints = true): UnicodeCoverage {
  const sorted = [...new Set(codePoints)].sort((left, right) => left - right)
  const ranges = createUnicodeRanges(sorted)
  return {
    count: sorted.length,
    codePoints: includeCodePoints ? formatCodePoints(sorted) : [],
    ranges,
    cssUnicodeRange: ranges.join(', '),
  }
}

function createUnicodeRanges(codePoints: number[]): string[] {
  if (codePoints.length === 0) return []
  const ranges: string[] = []
  let start = codePoints[0]!
  let end = start
  for (const codePoint of codePoints.slice(1)) {
    if (codePoint === end + 1) {
      end = codePoint
      continue
    }
    ranges.push(formatRange(start, end))
    start = codePoint
    end = codePoint
  }
  ranges.push(formatRange(start, end))
  return ranges
}

function formatRange(start: number, end: number): string {
  const first = formatCodePoint(start)
  return start === end ? first : `${first}-${formatCodePoint(end).slice(2)}`
}

function formatCodePoints(codePoints: number[]): string[] {
  return codePoints.map(formatCodePoint)
}

function formatCodePoint(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`
}

async function loadCachedSource(source: {
  url: string
  sha256: string
  fileName: string
}): Promise<CachedSource> {
  const cacheDirectory = resolve('.musubi', 'font', 'sources')
  await mkdir(cacheDirectory, { recursive: true, mode: 0o700 })
  await chmod(cacheDirectory, 0o700)
  const cachePath = join(cacheDirectory, `${source.sha256}-${source.fileName}`)
  const cached = await readFile(cachePath).catch(() => null)
  if (cached && sha256(cached) === source.sha256) {
    await chmod(cachePath, 0o600)
    return { buffer: cached, bytes: cached.length }
  }
  if (cached) await rm(cachePath, { force: true })

  const response = await fetch(source.url, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(
      `Unable to download pinned font source (${response.status} ${response.statusText}).`,
    )
  }
  const downloaded = Buffer.from(await response.arrayBuffer())
  const actualChecksum = sha256(downloaded)
  if (actualChecksum !== source.sha256) {
    throw new Error(
      `Pinned font source checksum mismatch for ${source.fileName}: expected ${source.sha256}, received ${actualChecksum}.`,
    )
  }
  await writeAtomic(cachePath, downloaded, 0o600)
  return { buffer: downloaded, bytes: downloaded.length }
}

async function readVerifiedRepositoryFile(source: {
  path: string
  sha256: string
}): Promise<Buffer> {
  const buffer = await readFile(resolve(process.cwd(), source.path))
  const checksum = sha256(buffer)
  if (checksum !== source.sha256) {
    throw new Error(
      `Checked-in font license checksum mismatch for ${source.path}: expected ${source.sha256}, received ${checksum}.`,
    )
  }
  return buffer
}

async function writeAtomic(path: string, data: string | Uint8Array, mode: number): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = join(dirname(path), `.${basename(path)}.${process.pid}.tmp`)
  await writeFile(temporaryPath, data, { mode })
  await rename(temporaryPath, path)
  await chmod(path, mode)
}

async function assertToolVersion(packageName: string, expected: string): Promise<void> {
  let directory = dirname(require.resolve(packageName))
  while (true) {
    const packagePath = join(directory, 'package.json')
    const manifest = await readFile(packagePath, 'utf8').catch(() => null)
    if (manifest) {
      const version = (JSON.parse(manifest) as { version?: unknown }).version
      if (version !== expected) {
        throw new Error(
          `${packageName} ${String(version)} is installed; Musubi requires ${expected}.`,
        )
      }
      return
    }
    const parent = dirname(directory)
    if (parent === directory) break
    directory = parent
  }
  throw new Error(`Unable to verify the installed ${packageName} package version.`)
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function sameNumbers(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}