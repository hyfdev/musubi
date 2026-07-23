import { describe, expect, it } from 'vite-plus/test'
import { isExternalSiteLink } from './link.ts'

const siteLink = 'https://musubi.hyf.me/'

describe('site link classification', () => {
  it('keeps relative and same-origin absolute links in the current context', () => {
    expect(isExternalSiteLink('/blog/quiet-builds', siteLink)).toBe(false)
    expect(isExternalSiteLink('#section', siteLink)).toBe(false)
    expect(isExternalSiteLink('https://musubi.hyf.me/blog/quiet-builds', siteLink)).toBe(false)
  })

  it('opens an absolute link to another origin externally', () => {
    expect(isExternalSiteLink('https://github.com/hyfdev/musubi', siteLink)).toBe(true)
  })
})