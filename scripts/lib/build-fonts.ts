import { createHash } from 'node:crypto'
import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { createFont, woff2 } from 'fonteditor-core'
import subsetFont from 'subset-font'

const require = createRequire(import.meta.url)

const LUO_SOURCE = {
  repository: 'https://github.com/tw93/Luo',
  commit: '588c4f3dbe3a0e9b3b860ca62f61ca9b373909d1',
  path: 'dist/Luo-Regular.woff2',
  url: 'https://raw.githubusercontent.com/tw93/Luo/588c4f3dbe3a0e9b3b860ca62f61ca9b373909d1/dist/Luo-Regular.woff2',
  sha256: '661581c1210598a1b6950c34b160fe0318b4cdc122fea8aeed11691555336724',
  fileName: 'Luo-Regular.woff2',
} as const

const LXGW_SOURCE = {
  repository: 'https://github.com/lxgw/LxgwWenKai-Screen',
  release: 'v1.522',
  asset: 'LXGWWenKaiScreen.ttf',
  url: 'https://github.com/lxgw/LxgwWenKai-Screen/releases/download/v1.522/LXGWWenKaiScreen.ttf',
  sha256: 'cd1a6fa39c4ea42fd8f4e289945789b0e510cf7016435640f8893cdad9b220f3',
  fileName: 'LXGWWenKaiScreen.ttf',
} as const

const TOOL_VERSIONS = {
  subsetFont: '2.5.0',
  fonteditorCore: '2.6.3',
} as const

const OUTPUT_PATHS = {
  luo: 'fonts/Luo-Regular.woff2',
  fallback: 'fonts/Musubi-CJK-Fallback.woff2',
  manifest: 'fonts/fonts-manifest.json',
  luoLicense: 'fonts/OFL-Luo.txt',
  fallbackLicense: 'fonts/OFL-Musubi-CJK-Fallback.txt',
} as const

const SOURCE_LICENSES = {
  luo: {
    path: 'licenses/fonts/OFL-Luo.txt',
    sha256: '2d70319f015145f9f17ffffac8b8440ad3b855f4c9ab7e608df631d6347fff0d',
  },
  fallback: {
    path: 'licenses/fonts/OFL-Musubi-CJK-Fallback.txt',
    sha256: '4d72e3080cdb3be63638bb7197c7caae55b6e4cbe1bab1ded2830bdff0c9b438',
  },
} as const

const FALLBACK_FAMILY = 'Musubi CJK Fallback'
const FALLBACK_POSTSCRIPT_NAME = 'Musubi-CJK-Fallback'
const FALLBACK_UNIQUE_NAME = 'Musubi CJK Fallback Regular'
const RESERVED_FONT_NAME_PATTERN = /LXGW\s*WenKai|LXGWWenKai/iu
const HAN_CHARACTER = /^\p{Script_Extensions=Han}$/u
const EXTRA_CHINESE_PUNCTUATION = new Set([
  0x00b7, // middle dot
  0x2014, // em dash
  0x2018, // left single quotation mark
  0x2019, // right single quotation mark
  0x201c, // left double quotation mark
  0x201d, // right double quotation mark
  0x2026, // horizontal ellipsis
  0x2e3a, // two-em dash
  0x2e3b, // three-em dash
])

const PRESERVED_NAME_IDS = Array.from({ length: 26 }, (_, index) => index)

export type ChineseTypographyCategory =
  | 'han'
  | 'cjkPunctuation'
  | 'fullwidth'
  | 'otherChinesePunctuation'

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
  schemaVersion: 1
  familyStack: readonly ['Luo', 'Musubi CJK Fallback']
  tools: {
    subsetFont: string
    fonteditorCore: string
  }
  sources: {
    luo: {
      repository: string
      commit: string
      path: string
      url: string
      bytes: number
      sha256: string
      cmapCodePointCount: number
    }
    fallback: {
      repository: string
      release: string
      asset: string
      url: string
      bytes: number | null
      sha256: string
      verifiedRequiredCodePointCount: number | null
    }
  }
  selectedCorpus: {
    coverage: UnicodeCoverage
    categoryCounts: Record<ChineseTypographyCategory, number>
  }
  resolvedCoverage: {
    luo: UnicodeCoverage
    fallback: UnicodeCoverage
  }
  artifacts: {
    luo: FontArtifact
    fallback: FontArtifact | null
    manifestPath: string
  }
  licenses: {
    luo: { path: string; sha256: string }
    fallback: { path: string; sha256: string }
  }
}

interface CachedSource {
  buffer: Buffer
  bytes: number
}

interface ParsedNameRecord {
  platformId: number
  encodingId: number
  languageId: number
  nameId: number
  value: string
}

/**
 * Build Musubi's pinned Luo font and the corpus-derived matching fallback into
 * a generated public directory. The source fonts are checksum-addressed in a
 * private user cache and never written into the repository.
 */
export async function buildPublicFonts(
  publicCorpus: string,
  generatedPublicDirectory: string,
): Promise<FontBuildManifest> {
  if (typeof publicCorpus !== 'string') {
    throw new TypeError('The public font corpus must be a string.')
  }
  if (typeof generatedPublicDirectory !== 'string' || generatedPublicDirectory.trim() === '') {
    throw new TypeError('The generated public directory must be a nonempty path.')
  }

  await assertToolVersion('subset-font', TOOL_VERSIONS.subsetFont)
  await assertToolVersion('fonteditor-core', TOOL_VERSIONS.fonteditorCore)
  await woff2.init()

  const outputRoot = resolve(generatedPublicDirectory)
  const outputFontDirectory = join(outputRoot, 'fonts')
  await mkdir(outputFontDirectory, { recursive: true })

  const selected = collectChineseTypographyCodePoints(publicCorpus)
  const luoSource = await loadCachedSource(LUO_SOURCE)
  const luoCmap = readCmap(luoSource.buffer, 'woff2')
  const coveredByLuo = selected.codePoints.filter((codePoint) => luoCmap.has(codePoint))
  const missingFromLuo = selected.codePoints.filter((codePoint) => !luoCmap.has(codePoint))

  const luoOutputPath = join(outputRoot, OUTPUT_PATHS.luo)
  await writeAtomic(luoOutputPath, luoSource.buffer, 0o644)

  const luoLicense = await readVerifiedRepositoryFile(SOURCE_LICENSES.luo)
  const fallbackLicense = await readVerifiedRepositoryFile(SOURCE_LICENSES.fallback)
  await writeAtomic(join(outputRoot, OUTPUT_PATHS.luoLicense), luoLicense, 0o644)
  await writeAtomic(join(outputRoot, OUTPUT_PATHS.fallbackLicense), fallbackLicense, 0o644)

  let fallbackArtifact: FontArtifact | null = null
  let fallbackSourceBytes: number | null = null
  let fallbackVerifiedRequiredCount: number | null = null

  if (missingFromLuo.length > 0) {
    const fallbackSource = await loadCachedSource(LXGW_SOURCE)
    fallbackSourceBytes = fallbackSource.bytes
    const fallbackSourceCmap = readCmap(fallbackSource.buffer, 'ttf', missingFromLuo)
    fallbackVerifiedRequiredCount = missingFromLuo.filter((codePoint) =>
      fallbackSourceCmap.has(codePoint),
    ).length
    const unavailable = missingFromLuo.filter((codePoint) => !fallbackSourceCmap.has(codePoint))
    if (unavailable.length > 0) {
      throw new Error(
        `Required Chinese typography code points are absent from both pinned fonts: ${formatCodePoints(unavailable).join(', ')}`,
      )
    }

    const fallbackBuffer = await createFallbackFont(fallbackSource.buffer, missingFromLuo)
    validateFallbackFont(fallbackBuffer, missingFromLuo)
    const fallbackOutputPath = join(outputRoot, OUTPUT_PATHS.fallback)
    await writeAtomic(fallbackOutputPath, fallbackBuffer, 0o644)
    fallbackArtifact = createArtifact(
      OUTPUT_PATHS.fallback,
      FALLBACK_FAMILY,
      fallbackBuffer,
      missingFromLuo,
    )
  } else {
    await rm(join(outputRoot, OUTPUT_PATHS.fallback), { force: true })
  }

  const manifest: FontBuildManifest = {
    schemaVersion: 1,
    familyStack: ['Luo', 'Musubi CJK Fallback'],
    tools: {
      subsetFont: TOOL_VERSIONS.subsetFont,
      fonteditorCore: TOOL_VERSIONS.fonteditorCore,
    },
    sources: {
      luo: {
        repository: LUO_SOURCE.repository,
        commit: LUO_SOURCE.commit,
        path: LUO_SOURCE.path,
        url: LUO_SOURCE.url,
        bytes: luoSource.bytes,
        sha256: LUO_SOURCE.sha256,
        cmapCodePointCount: luoCmap.size,
      },
      fallback: {
        repository: LXGW_SOURCE.repository,
        release: LXGW_SOURCE.release,
        asset: LXGW_SOURCE.asset,
        url: LXGW_SOURCE.url,
        bytes: fallbackSourceBytes,
        sha256: LXGW_SOURCE.sha256,
        verifiedRequiredCodePointCount: fallbackVerifiedRequiredCount,
      },
    },
    selectedCorpus: {
      coverage: createCoverage(selected.codePoints),
      categoryCounts: selected.categoryCounts,
    },
    resolvedCoverage: {
      luo: createCoverage(coveredByLuo),
      fallback: createCoverage(missingFromLuo),
    },
    artifacts: {
      luo: createArtifact(OUTPUT_PATHS.luo, 'Luo', luoSource.buffer, coveredByLuo),
      fallback: fallbackArtifact,
      manifestPath: OUTPUT_PATHS.manifest,
    },
    licenses: {
      luo: { path: OUTPUT_PATHS.luoLicense, sha256: SOURCE_LICENSES.luo.sha256 },
      fallback: {
        path: OUTPUT_PATHS.fallbackLicense,
        sha256: SOURCE_LICENSES.fallback.sha256,
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

function classifyChineseTypographyCodePoint(
  character: string,
  codePoint: number,
): ChineseTypographyCategory | null {
  if (
    (codePoint >= 0x3000 && codePoint <= 0x303f) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe4f)
  ) {
    return 'cjkPunctuation'
  }
  if (
    (codePoint >= 0xff01 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6)
  ) {
    return 'fullwidth'
  }
  if (EXTRA_CHINESE_PUNCTUATION.has(codePoint)) return 'otherChinesePunctuation'
  if (HAN_CHARACTER.test(character)) return 'han'
  return null
}

async function createFallbackFont(source: Buffer, codePoints: number[]): Promise<Buffer> {
  const subsetText = codePoints.map((codePoint) => String.fromCodePoint(codePoint)).join('')
  const subset = await subsetFont(source, subsetText, {
    targetFormat: 'woff2',
    preserveNameIds: PRESERVED_NAME_IDS,
  })
  const parsed = createFont(Buffer.from(subset), { type: 'woff2', compound2simple: false })
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
    fontSubFamily: 'Regular',
    uniqueSubFamily: FALLBACK_UNIQUE_NAME,
    fullName: FALLBACK_FAMILY,
    postScriptName: FALLBACK_POSTSCRIPT_NAME,
    preferredFamily: FALLBACK_FAMILY,
    preferredSubFamily: 'Regular',
  })

  // fonteditor-core's direct WOFF2 writer returns an empty buffer for this
  // source. Its supported WASM encoder is deterministic when fed the TTF
  // writer output, so use that explicit path.
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

function validateFallbackFont(buffer: Buffer, requiredCodePoints: number[]): void {
  if (buffer.subarray(0, 4).toString('ascii') !== 'wOF2') {
    throw new Error('Generated fallback is not a structurally recognizable WOFF2 file.')
  }
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
    fullName: FALLBACK_FAMILY,
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
  const expectedByNameId = new Map<number, string>([
    [1, FALLBACK_FAMILY],
    [3, FALLBACK_UNIQUE_NAME],
    [4, FALLBACK_FAMILY],
    [6, FALLBACK_POSTSCRIPT_NAME],
    [16, FALLBACK_FAMILY],
  ])
  for (const [nameId, expected] of expectedByNameId) {
    const localizedRecords = nameRecords.filter((record) => record.nameId === nameId)
    if (localizedRecords.length === 0 && nameId !== 16) {
      throw new Error(
        `Generated fallback has no name-table records for required name ID ${nameId}.`,
      )
    }
    for (const record of localizedRecords) {
      if (record.value !== expected) {
        throw new Error(
          `Generated fallback name ID ${nameId} has an unrewritten localized value "${record.value}".`,
        )
      }
    }
  }
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

function readCmap(buffer: Buffer, type: 'ttf' | 'woff2', subset?: number[]): Set<number> {
  const font = createFont(buffer, {
    type,
    subset,
    compound2simple: false,
  })
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
): FontArtifact {
  return {
    path,
    family,
    bytes: buffer.length,
    sha256: sha256(buffer),
    coverage: createCoverage(codePoints),
  }
}

function createCoverage(codePoints: number[]): UnicodeCoverage {
  const sorted = [...new Set(codePoints)].sort((left, right) => left - right)
  const ranges = createUnicodeRanges(sorted)
  return {
    count: sorted.length,
    codePoints: formatCodePoints(sorted),
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