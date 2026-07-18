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