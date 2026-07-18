export const NOTION_SNAPSHOT_SCHEMA_VERSION = 1

export interface NotionMarkdownSnapshot {
  object: 'page_markdown'
  id: string
  markdown: string
  truncated: boolean
  unknown_block_ids: string[]
}

export interface NotionConfigSnapshot {
  schemaVersion: typeof NOTION_SNAPSHOT_SCHEMA_VERSION
  notionApiVersion: string
  contentDataSource: unknown
  configDataSource: unknown
  configRows: unknown[]
}

export interface NotionPageSnapshot {
  schemaVersion: typeof NOTION_SNAPSHOT_SCHEMA_VERSION
  notionApiVersion: string
  page: unknown
  markdown: NotionMarkdownSnapshot
  unknownBlocks: unknown[]
}

export interface LoadedNotionPageSnapshot {
  filename: string
  data: NotionPageSnapshot
}

export interface NotionDataSnapshot {
  configFilename: string
  config: NotionConfigSnapshot
  pages: LoadedNotionPageSnapshot[]
}