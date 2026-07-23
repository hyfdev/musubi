import { describe, expect, it } from 'vite-plus/test'

import { NOTION_SNAPSHOT_SCHEMA_VERSION, type NotionDataSnapshot } from '../notion-data/types.ts'
import { createSite, normalizeNotionContentType } from './create.ts'

describe('legacy Notion content type compatibility', () => {
  it('maps legacy Content rows to Page without changing current Post, Page, and Home values', () => {
    expect(normalizeNotionContentType('Content', 'Legacy row')).toBe('Page')
    expect(normalizeNotionContentType('Page', 'Page row')).toBe('Page')
    expect(normalizeNotionContentType('Post', 'Post row')).toBe('Post')
    expect(normalizeNotionContentType('Home', 'Home row')).toBe('Home')
  })

  it('reports the source row when the type is invalid', () => {
    expect(() => normalizeNotionContentType('Article', 'Content row 3')).toThrow(
      'Content row 3.Type must be Post, Page, or Home',
    )
  })
})

describe('Notion workspace schema names', () => {
  it('accepts the canonical Title Case Content fields and Config Help title', async () => {
    const site = await createSite(
      snapshot('Publish Date', 'Show in Navigation', 'Navigation Order', 'Help'),
    )

    expect(site.posts).toEqual([])
    expect(site.pages).toEqual([])
  })

  it('keeps the former Date, camel-case navigation, and Config Description names compatible', async () => {
    const site = await createSite(
      snapshot('Date', 'ShowInNavigation', 'NavigationOrder', 'Description'),
    )

    expect(site.posts).toEqual([])
    expect(site.pages).toEqual([])
  })

  it('rejects an ambiguous source that contains both canonical and legacy property names', async () => {
    const value = snapshot('Publish Date', 'Show in Navigation', 'Navigation Order', 'Help')
    const contentSource = value.config.contentDataSource as { properties: Record<string, unknown> }
    contentSource.properties.Date = property('date')

    await expect(createSite(value)).rejects.toThrow(
      'has conflicting Publish Date and Date properties; keep only Publish Date',
    )
  })

  it('accepts a compatible source without optional Tags or navigation properties', async () => {
    const value = snapshot('Publish Date', 'Show in Navigation', 'Navigation Order', 'Help')
    const contentSource = value.config.contentDataSource as { properties: Record<string, unknown> }
    delete contentSource.properties.Tags
    delete contentSource.properties['Show in Navigation']
    delete contentSource.properties['Navigation Order']

    const site = await createSite(value)

    expect(site.posts).toEqual([])
    expect(site.pages).toEqual([])
  })
})

function property(type: string): { type: string } {
  return { type }
}

function snapshot(
  dateName: string,
  visibilityName: string,
  orderName: string,
  helpName: string,
): NotionDataSnapshot {
  return {
    configFilename: 'config.json',
    config: {
      schemaVersion: NOTION_SNAPSHOT_SCHEMA_VERSION,
      notionApiVersion: '2026-03-11',
      contentDataSource: {
        object: 'data_source',
        properties: {
          Title: property('title'),
          Slug: property('rich_text'),
          [dateName]: property('date'),
          Status: property('select'),
          Type: property('select'),
          Description: property('rich_text'),
          Tags: property('multi_select'),
          [visibilityName]: property('checkbox'),
          [orderName]: property('number'),
        },
      },
      configDataSource: {
        object: 'data_source',
        properties: {
          [helpName]: property('title'),
          Key: property('select'),
          Value: property('rich_text'),
          Enable: property('checkbox'),
        },
      },
      configRows: [],
    },
    pages: [],
  }
}