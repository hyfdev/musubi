import { describe, expect, it } from 'vite-plus/test'
import {
  classifyChineseTypographyText,
  segmentChineseTypographyText,
} from './chinese-typography.ts'

function selectedCharacters(value: string): string {
  return classifyChineseTypographyText(value)
    .filter((entry) => entry.cjk)
    .map((entry) => entry.character)
    .join('')
}

describe('contextual Chinese typography', () => {
  it('keeps ambiguous punctuation in Latin text with the Latin font', () => {
    expect(selectedCharacters('English — prose · more…')).toBe('')
  })

  it('assigns the same punctuation to Chinese when Han text surrounds it', () => {
    expect(selectedCharacters('中文——示例·继续……')).toBe('中文——示例·继续……')
  })

  it('does not let adjacent collected fields influence punctuation across newlines', () => {
    expect(selectedCharacters('“English”\n“中文”')).toBe('“中文”')
  })

  it('uses the closer script when Latin and Chinese appear on opposite sides', () => {
    expect(selectedCharacters('“English” 中文')).toBe('中文')
    expect(selectedCharacters('中文……” English')).toBe('中文……”')
  })

  it('uses one context across inline markup boundaries', () => {
    const context = '“中文”'
    expect(segmentChineseTypographyText('“', context, 0)).toEqual([{ value: '“', cjk: true }])
    expect(segmentChineseTypographyText('中文', context, 1)).toEqual([{ value: '中文', cjk: true }])
    expect(segmentChineseTypographyText('”', context, 3)).toEqual([{ value: '”', cjk: true }])
  })
})