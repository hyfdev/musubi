import { describe, expect, it } from 'vite-plus/test'

import { normalizeNotionContentType } from './create.ts'

describe('legacy Notion content type compatibility', () => {
  it('maps legacy Content rows to Page without changing current Post and Page values', () => {
    expect(normalizeNotionContentType('Content', 'Legacy row')).toBe('Page')
    expect(normalizeNotionContentType('Page', 'Page row')).toBe('Page')
    expect(normalizeNotionContentType('Post', 'Post row')).toBe('Post')
  })

  it('reports the source row when the type is invalid', () => {
    expect(() => normalizeNotionContentType('Article', 'Content row 3')).toThrow(
      'Content row 3.Type must be Post or Page',
    )
  })
})