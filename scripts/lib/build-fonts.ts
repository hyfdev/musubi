import { createHash } from 'node:crypto'
import { chmod, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { createFont, woff2 } from 'fonteditor-core'
import subsetFont from 'subset-font'
import {
  classifyChineseTypographyCodePoint,
  type ChineseTypographyCategory,
} from '../../shared/chinese-typography.ts'
import { inspectTsangerFontCache } from './tsanger-fonts.ts'

const require = createRequire(import.meta.url)

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
} as const

const TSANGER_OUTPUT_NAMES = {
  w04: 'Tsanger-JinKai-W04-subset',
  w05: 'Tsanger-JinKai-W05-subset',
} as const

const FALLBACK_LICENSE = {
  path: 'licenses/fonts/OFL-Musubi-CJK-Fallback.txt',
  sha256: '66e75815b1bb90bdaede3649abf5ea029d0dc7d5e61b0534d3245db61a510b93',
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
  body: string
  emphasis: string
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

export interface FontBuildManifest {
  schemaVersion: 3
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
  }
  selectedCorpora: {
    body: UnicodeCoverage
    emphasis: UnicodeCoverage
  }
  artifacts: {
    tsangerW04: FontArtifact | null
    tsangerW05: FontArtifact | null
    fallbackShards: FontArtifact[]
    manifestPath: string
  }
  licenses: {
    fallback: { path: string; sha256: string }
  }
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
  if (typeof corpora.body !== 'string' || typeof corpora.emphasis !== 'string') {
    throw new TypeError('The public font corpora must contain body and emphasis strings.')
  }
  if (typeof generatedPublicDirectory !== 'string' || generatedPublicDirectory.trim() === '') {
    throw new TypeError('The generated public directory must be a nonempty path.')
  }

  await assertToolVersion('subset-font', TOOL_VERSIONS.subsetFont)
  await assertToolVersion('fonteditor-core', TOOL_VERSIONS.fonteditorCore)
  await woff2.init()

  const outputRoot = resolve(generatedPublicDirectory)
  await mkdir(join(outputRoot, 'fonts'), { recursive: true })
  const fallbackLicense = await readVerifiedRepositoryFile(FALLBACK_LICENSE)
  await writeAtomic(join(outputRoot, OUTPUT_PATHS.fallbackLicense), fallbackLicense, 0o644)

  const fallbackSource = await loadCachedSource(LXGW_SOURCE)
  const fallbackCmap = readCmap(fallbackSource.buffer, 'ttf')
  const fallbackCodePoints = [...fallbackCmap].sort((left, right) => left - right)
  const fallbackAvailable = new Set(fallbackCodePoints)
  const fallbackShards = await buildFallbackShards(
    fallbackSource.buffer,
    fallbackCodePoints,
    outputRoot,
  )

  const body = collectChineseTypographyCodePoints(corpora.body)
  const emphasis = collectChineseTypographyCodePoints(corpora.emphasis)
  const required = [...new Set([...body.codePoints, ...emphasis.codePoints])]
  const unavailable = required.filter((codePoint) => !fallbackAvailable.has(codePoint))
  if (unavailable.length > 0) {
    throw new Error(
      `Required Chinese typography code points are absent from the complete fallback: ${formatCodePoints(unavailable).join(', ')}`,
    )
  }

  const tsangerSources = await loadLocalTsangerSources()
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
      body.codePoints,
      TSANGER_OUTPUT_NAMES.w04,
      'Tsanger JinKai W04',
      outputRoot,
    )
    tsangerW05 = await buildTsangerSubset(
      tsangerSources.w05.buffer,
      emphasis.codePoints,
      TSANGER_OUTPUT_NAMES.w05,
      'Tsanger JinKai W05',
      outputRoot,
    )
  }

  const manifest: FontBuildManifest = {
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
      body: createCoverage(body.codePoints),
      emphasis: createCoverage(emphasis.codePoints),
    },
    artifacts: {
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
    },
  }

  await writeAtomic(
    join(outputRoot, OUTPUT_PATHS.manifest),
    `${JSON.stringify(manifest, null, 2)}\n`,
    0o644,
  )
  return manifest
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
  const cacheDirectory = join(homedir(), '.cache', 'musubi', 'font-artifacts')
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
  for (const character of corpus) {
    const codePoint = character.codePointAt(0)
    if (codePoint === undefined || byCodePoint.has(codePoint)) continue
    const category = classifyChineseTypographyCodePoint(character, codePoint)
    if (category) byCodePoint.set(codePoint, category)
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
  const cacheDirectory = join(homedir(), '.cache', 'musubi', 'font-inputs')
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