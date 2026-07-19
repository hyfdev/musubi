import { describe, expect, it } from 'vite-plus/test'

import { resolveSiteConfig } from './config.ts'

describe('site configuration', () => {
  it('keeps optional social links hidden when their rows are absent or disabled', () => {
    const config = resolveSiteConfig([])

    expect(config.github).toBe('')
    expect(config.x).toBe('')
  })

  it('uses the canonical Site Title and Site Description keys', () => {
    const config = resolveSiteConfig([
      row('Site Title', 'My site'),
      row('Site Description', 'A small place on the web'),
    ])

    expect(config.title).toBe('My site')
    expect(config.description).toBe('A small place on the web')
  })

  it('keeps the former Title and Description keys compatible', () => {
    const config = resolveSiteConfig([
      row('Title', 'My site'),
      row('Description', 'A small place on the web'),
    ])

    expect(config.title).toBe('My site')
    expect(config.description).toBe('A small place on the web')
  })

  it('rejects canonical and legacy aliases for the same setting together', () => {
    expect(() => resolveSiteConfig([row('Site Title', 'One'), row('Title', 'Two')])).toThrow(
      'duplicate enabled Config key Site Title',
    )
  })

  it('accepts removed pagination and footer-year keys only as validated legacy input', () => {
    const config = resolveSiteConfig([row('Since', '2024'), row('PostsPerPage', '10')])

    expect(config).not.toHaveProperty('since')
    expect(config).not.toHaveProperty('postsPerPage')
  })

  it('still rejects invalid values for removed legacy keys', () => {
    expect(() => resolveSiteConfig([row('PostsPerPage', 'all')])).toThrow(
      'PostsPerPage must be a base-10 integer',
    )
  })
})

function row(key: string, value: string) {
  return {
    sourceLabel: `Config ${key}`,
    key,
    value,
    enabled: true,
  }
}