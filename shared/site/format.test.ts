import { describe, expect, it } from 'vite-plus/test'
import { formatPublishedDate, formatPublishedYear } from './format.ts'
import type { SiteConfig } from './types.ts'

const config: SiteConfig = {
  title: 'Musubi',
  description: '',
  author: 'Musubi Team',
  link: 'https://example.com',
  lang: 'en',
  timezone: 'Asia/Singapore',
  github: '',
  x: '',
}

describe('publication date formatting', () => {
  it('derives an archive year from the same site timezone as the visible date', () => {
    const value = '2025-12-31T18:30:00Z'
    expect(formatPublishedDate(value, config, 'month-day')).toBe('Jan 1')
    expect(formatPublishedYear(value, config)).toBe('2026')
  })

  it('keeps date-only values in their displayed year', () => {
    expect(formatPublishedDate('2026-07-14', config, 'month-day')).toBe('Jul 14')
    expect(formatPublishedYear('2026-07-14', config)).toBe('2026')
  })

  it('treats a date-only value as a calendar date even in UTC+14', () => {
    const utcPlusFourteen = { ...config, timezone: 'Pacific/Kiritimati' }
    expect(formatPublishedDate('2026-07-14', utcPlusFourteen, 'month-day')).toBe('Jul 14')
    expect(formatPublishedYear('2026-07-14', utcPlusFourteen)).toBe('2026')
  })
})