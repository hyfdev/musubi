const HAN_CHARACTER = /^\p{Script_Extensions=Han}$/u

const EXTRA_CHINESE_PUNCTUATION = new Set([
  0x00b7, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x2e3a, 0x2e3b,
])

export type ChineseTypographyCategory =
  | 'han'
  | 'cjkPunctuation'
  | 'fullwidth'
  | 'otherChinesePunctuation'

export function classifyChineseTypographyCodePoint(
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

export function isChineseTypographyCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0)
  return (
    codePoint !== undefined && classifyChineseTypographyCodePoint(character, codePoint) !== null
  )
}