import { describe, expect, it } from 'vite-plus/test'

import { normalizeNotionContentType } from './notion.ts'

describe('Notion Page type compatibility', () => {
  it('uses Page as the canonical standalone-page type', () => {
    expect(normalizeNotionContentType('Page', 'row')).toBe('Page')
  })

  it('maps the legacy Content option to Page during migration', () => {
    expect(normalizeNotionContentType('Content', 'row')).toBe('Page')
  })

  it('rejects unsupported source values', () => {
    expect(() => normalizeNotionContentType('Article', 'row')).toThrow(
      'row.Type must be Post or Page',
    )
  })
})