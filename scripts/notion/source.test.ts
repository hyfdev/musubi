import { describe, expect, it } from 'vite-plus/test'

import { onlyDataSourceId, readNotionEnvironment } from './source.ts'

describe('Notion page inputs', () => {
  it('reads the two user-visible page IDs', () => {
    expect(
      readNotionEnvironment({
        NOTION_TOKEN: 'token',
        NOTION_DB_PAGE_ID: 'content-page',
        NOTION_CONFIG_PAGE_ID: 'config-page',
      }),
    ).toEqual({
      token: 'token',
      dbPageId: 'content-page',
      configPageId: 'config-page',
    })
  })

  it("selects the page's only data source internally", () => {
    expect(
      onlyDataSourceId('Database page', [
        { id: '248104cd477e80fdb757e945d38000bd', name: 'Database' },
      ]),
    ).toBe('248104cd-477e-80fd-b757-e945d38000bd')
  })

  it.each([
    { dataSources: [] },
    {
      dataSources: [
        { id: 'a', name: 'One' },
        { id: 'b', name: 'Two' },
      ],
    },
  ])('rejects a page with zero or multiple data sources', ({ dataSources }) => {
    expect(() => onlyDataSourceId('Database page', dataSources)).toThrow(
      `Database page must contain exactly one data source; found ${dataSources.length}.`,
    )
  })
})