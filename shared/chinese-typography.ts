const HAN_CHARACTER = /^\p{Script_Extensions=Han}$/u
const LETTER_OR_NUMBER = /^[\p{Letter}\p{Number}]$/u

const CONTEXTUAL_CHINESE_PUNCTUATION = new Set([
  0x00b7, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x2e3a, 0x2e3b,
])

export type ChineseTypographyCategory =
  | 'han'
  | 'cjkPunctuation'
  | 'fullwidth'
  | 'otherChinesePunctuation'

export interface ClassifiedTypographyCharacter {
  character: string
  codePoint: number
  offset: number
  category: ChineseTypographyCategory | null
  cjk: boolean
}

export interface ChineseTypographySegment {
  value: string
  cjk: boolean
}

interface NearbyScript {
  script: 'cjk' | 'other'
  distance: number
}

/** Classifies characters that are unambiguously Chinese without surrounding text. */
export function classifyChineseTypographyCodePoint(
  character: string,
  codePoint: number,
): ChineseTypographyCategory | null {
  if (CONTEXTUAL_CHINESE_PUNCTUATION.has(codePoint)) return null
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
  if (HAN_CHARACTER.test(character)) return 'han'
  return null
}

/**
 * Classifies a complete text run so punctuation shared by Chinese and Latin typography follows
 * the nearest script on either side. Newlines stop the lookup and therefore keep separately
 * collected fields from influencing one another.
 */
export function classifyChineseTypographyText(value: string): ClassifiedTypographyCharacter[] {
  const characters: ClassifiedTypographyCharacter[] = []
  let offset = 0
  for (const character of value) {
    const codePoint = character.codePointAt(0)!
    const category = classifyChineseTypographyCodePoint(character, codePoint)
    characters.push({ character, codePoint, offset, category, cjk: category !== null })
    offset += character.length
  }

  for (let start = 0; start < characters.length; start += 1) {
    if (!CONTEXTUAL_CHINESE_PUNCTUATION.has(characters[start]!.codePoint)) continue
    let end = start + 1
    while (
      end < characters.length &&
      CONTEXTUAL_CHINESE_PUNCTUATION.has(characters[end]!.codePoint)
    ) {
      end += 1
    }
    const left = nearestScript(characters, start, -1)
    const right = nearestScript(characters, end - 1, 1)
    if (resolveNearbyScript(left, right) === 'cjk') {
      for (let index = start; index < end; index += 1) {
        characters[index]!.category = 'otherChinesePunctuation'
        characters[index]!.cjk = true
      }
    }
    start = end - 1
  }
  return characters
}

/**
 * Segments a value using a larger inline context. `contextStart` is a UTF-16 offset, matching
 * JavaScript string slicing and allowing nested inline markup to share one classification run.
 */
export function segmentChineseTypographyText(
  value: string,
  context: string = value,
  contextStart = 0,
): ChineseTypographySegment[] {
  if (contextStart < 0 || context.slice(contextStart, contextStart + value.length) !== value) {
    throw new Error('Chinese typography context does not contain the supplied value at its offset.')
  }
  const classifications = new Map(
    classifyChineseTypographyText(context).map((entry) => [entry.offset, entry.cjk] as const),
  )
  const segments: ChineseTypographySegment[] = []
  let valueOffset = 0
  for (const character of value) {
    const cjk = classifications.get(contextStart + valueOffset) ?? false
    const previous = segments.at(-1)
    if (previous?.cjk === cjk) previous.value += character
    else segments.push({ value: character, cjk })
    valueOffset += character.length
  }
  return segments
}

export function isChineseTypographyCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0)
  return (
    codePoint !== undefined && classifyChineseTypographyCodePoint(character, codePoint) !== null
  )
}

function nearestScript(
  characters: readonly ClassifiedTypographyCharacter[],
  start: number,
  direction: -1 | 1,
): NearbyScript | null {
  for (let index = start + direction; index >= 0 && index < characters.length; index += direction) {
    const entry = characters[index]!
    if (entry.character === '\n' || entry.character === '\r') return null
    if (entry.cjk) return { script: 'cjk', distance: Math.abs(index - start) }
    if (CONTEXTUAL_CHINESE_PUNCTUATION.has(entry.codePoint)) continue
    if (LETTER_OR_NUMBER.test(entry.character)) {
      return { script: 'other', distance: Math.abs(index - start) }
    }
  }
  return null
}

function resolveNearbyScript(
  left: NearbyScript | null,
  right: NearbyScript | null,
): NearbyScript['script'] | null {
  if (!left) return right?.script ?? null
  if (!right || left.script === right.script || left.distance <= right.distance) {
    return left.script
  }
  return right.script
}