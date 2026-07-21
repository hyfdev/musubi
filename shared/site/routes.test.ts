import { describe, expect, it } from 'vite-plus/test'
import { buildRouteManifest } from './routes.ts'
import type { SourceContentRow } from './types.ts'

describe('Page navigation defaults', () => {
  it('keeps a published Page routable without promoting it to the default navigation', () => {
    const manifest = buildRouteManifest([page()])

    expect(manifest.routes).toContain('/about')
    expect(manifest.navigation).toEqual([])
  })

  it('shows a Page when its source explicitly enables navigation', () => {
    const manifest = buildRouteManifest([page({ showInNavigation: true })])

    expect(manifest.navigation).toEqual([{ title: 'About', route: '/about' }])
  })
})

describe('Post publishing metadata', () => {
  it('names the missing required date with the canonical Publish Date term', () => {
    expect(() => buildRouteManifest([post()])).toThrow(
      'Content row 1 ("Post"): Published Post requires a Publish Date',
    )
  })
})

describe('Home routing', () => {
  it('keeps the generated Home when no Home row is published', () => {
    const manifest = buildRouteManifest([page()])

    expect(manifest.home).toBeUndefined()
    expect(manifest.entries.find((entry) => entry.route === '/')?.sourceLabel).toBe(
      'generated recent-Post Home',
    )
  })

  it('routes a published Home row to `/` without consuming a path segment', () => {
    const manifest = buildRouteManifest([home(), page()])

    expect(manifest.home?.route).toBe('/')
    expect(manifest.home?.slug).toBe('')
    expect(manifest.routes).toEqual(['/', '/blog', '/about'])
    expect(manifest.entries.find((entry) => entry.route === '/')).toMatchObject({
      kind: 'home',
      outputFile: 'index.html',
      sourceLabel: 'Content row 1 ("Home")',
    })
  })

  it('keeps Home out of the Page routes and the navigation', () => {
    const manifest = buildRouteManifest([home({ showInNavigation: true }), page()])

    expect(manifest.standalonePages.map((entry) => entry.route)).toEqual(['/about'])
    expect(manifest.navigation).toEqual([])
  })

  it('rejects a Home row that also claims a Slug', () => {
    expect(() => buildRouteManifest([home({ slug: 'home' })])).toThrow(
      'Content row 1 ("Home"): Home occupies `/` and must leave Slug empty',
    )
  })

  it('rejects a second published Home row', () => {
    expect(() =>
      buildRouteManifest([home(), home({ sourceLabel: 'Content row 2 ("Landing")' })]),
    ).toThrow('Only one Published Home may exist, found 2')
  })

  it('ignores a Home row that is still a draft', () => {
    const manifest = buildRouteManifest([home({ status: 'Draft' }), page()])

    expect(manifest.home).toBeUndefined()
  })

  it('does not require a Publish Date for Home', () => {
    expect(() => buildRouteManifest([home()])).not.toThrow()
  })
})

function page(overrides: Partial<SourceContentRow> = {}): SourceContentRow {
  return {
    sourceLabel: 'Content row 1 ("About")',
    title: 'About',
    slug: 'about',
    status: 'Published',
    type: 'Page',
    description: '',
    tags: [],
    ...overrides,
  }
}

function post(overrides: Partial<SourceContentRow> = {}): SourceContentRow {
  return {
    sourceLabel: 'Content row 1 ("Post")',
    title: 'Post',
    slug: 'post',
    status: 'Published',
    type: 'Post',
    description: '',
    tags: [],
    ...overrides,
  }
}

function home(overrides: Partial<SourceContentRow> = {}): SourceContentRow {
  return {
    sourceLabel: 'Content row 1 ("Home")',
    title: 'Home',
    slug: '',
    status: 'Published',
    type: 'Home',
    description: '',
    tags: [],
    ...overrides,
  }
}