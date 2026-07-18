import {
  Client,
  collectAllDataSourceRows,
  isFullDatabase,
  isFullPage,
  type DataSourceObjectResponse,
  type GetBlockResponse,
  type PageObjectResponse,
} from '@notionhq/client'

import { canonicalNotionId } from './id.ts'
import {
  NOTION_SNAPSHOT_SCHEMA_VERSION,
  type NotionConfigSnapshot,
  type NotionMarkdownSnapshot,
  type NotionPageSnapshot,
} from './types.ts'
import { mapConcurrent } from './concurrency.ts'

export const NOTION_API_VERSION = '2026-03-11'
const REQUEST_CONCURRENCY = 4
const NOTION_SECRET_NAMES = ['NOTION_TOKEN', 'NOTION_DB_PAGE_ID', 'NOTION_CONFIG_PAGE_ID'] as const

export interface NotionEnvironment {
  token: string
  dbPageId: string
  configPageId: string
}

export interface FetchedNotionData {
  config: NotionConfigSnapshot
  pages: Map<string, NotionPageSnapshot>
  reusedPages: number
}

export function readNotionEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): NotionEnvironment {
  const required = (
    name: 'NOTION_TOKEN' | 'NOTION_DB_PAGE_ID' | 'NOTION_CONFIG_PAGE_ID',
  ): string => {
    const legacyName =
      name === 'NOTION_DB_PAGE_ID'
        ? 'NOTION_CONTENT_DATABASE_ID'
        : name === 'NOTION_CONFIG_PAGE_ID'
          ? 'NOTION_CONFIG_DATABASE_ID'
          : undefined
    const value = environment[name]?.trim() || (legacyName && environment[legacyName]?.trim())
    if (!value) throw new Error(`Missing required build environment variable ${name}`)
    return value
  }
  return {
    token: required('NOTION_TOKEN'),
    dbPageId: required('NOTION_DB_PAGE_ID'),
    configPageId: required('NOTION_CONFIG_PAGE_ID'),
  }
}

export function createNotionClient(token: string): Client {
  return new Client({
    auth: token,
    notionVersion: NOTION_API_VERSION,
    timeoutMs: 30_000,
    retry: {
      maxRetries: 4,
      initialRetryDelayMs: 1_000,
      maxRetryDelayMs: 60_000,
    },
    logger: () => {},
  })
}

export function redactNotionSecrets(
  message: string,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  let redacted = message
  for (const name of NOTION_SECRET_NAMES) {
    const value = environment[name]?.trim()
    if (!value) continue
    const variants = new Set([value])
    const rawId = value.replaceAll('-', '')
    if (/^[a-f\d]{32}$/iu.test(rawId)) {
      variants.add(rawId)
      variants.add(canonicalNotionId(rawId))
    }
    for (const secret of variants) redacted = redacted.replaceAll(secret, `[redacted ${name}]`)
  }
  return redacted
}

function notionErrorDetail(error: unknown, environment: NotionEnvironment): string {
  const message = error instanceof Error ? error.message : 'Unknown Notion API failure'
  const record =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {}
  const code = typeof record.code === 'string' ? record.code : undefined
  const status = typeof record.status === 'number' ? record.status : undefined
  const prefix = [code, status ? `HTTP ${status}` : undefined].filter(Boolean).join(', ')
  const detail = redactNotionSecrets(message, {
    NOTION_TOKEN: environment.token,
    NOTION_DB_PAGE_ID: environment.dbPageId,
    NOTION_CONFIG_PAGE_ID: environment.configPageId,
  })
  return prefix ? `${prefix}: ${detail}` : detail
}

export function onlyDataSourceId(
  pageLabel: string,
  dataSources: ReadonlyArray<{ id: string; name: string }>,
): string {
  if (dataSources.length !== 1) {
    throw new Error(
      `${pageLabel} must contain exactly one data source; found ${dataSources.length}.`,
    )
  }
  return canonicalNotionId(dataSources[0]!.id, `${pageLabel} data source ID`)
}

async function notionRequest<T>(
  environment: NotionEnvironment,
  sourceLabel: string,
  action: string,
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request()
  } catch (error) {
    throw new Error(
      `${sourceLabel}: Notion ${action} failed (${notionErrorDetail(error, environment)})`,
      { cause: error },
    )
  }
}

function publishedStatus(page: PageObjectResponse, index: number): 'Draft' | 'Published' {
  const sourceLabel = `Content row ${index + 1}`
  const property = page.properties.Status
  if (!property || property.type !== 'select') {
    throw new Error(`${sourceLabel}.Status must be a select property`)
  }
  const status = property.select?.name
  if (status !== 'Draft' && status !== 'Published') {
    throw new Error(`${sourceLabel}.Status must be Draft or Published`)
  }
  return status
}

function canReusePage(previous: NotionPageSnapshot | undefined, page: PageObjectResponse): boolean {
  if (
    !previous ||
    previous.schemaVersion !== NOTION_SNAPSHOT_SCHEMA_VERSION ||
    previous.notionApiVersion !== NOTION_API_VERSION
  ) {
    return false
  }
  if (!previous.page || typeof previous.page !== 'object' || Array.isArray(previous.page)) {
    return false
  }
  const oldPage = previous.page as Record<string, unknown>
  return (
    oldPage.id === canonicalNotionId(page.id) &&
    oldPage.last_edited_time === page.last_edited_time &&
    !previous.unknownBlocks.some(
      (block) =>
        Boolean(block) &&
        typeof block === 'object' &&
        !Array.isArray(block) &&
        'request_id' in block,
    )
  )
}

function withoutRequestId<T>(value: T): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const stable = { ...(value as Record<string, unknown>) }
  delete stable.request_id
  return stable as T
}

function markdownSnapshot(response: {
  object: string
  id: string
  markdown: string
  truncated: boolean
  unknown_block_ids: string[]
}): NotionMarkdownSnapshot {
  return {
    object: 'page_markdown',
    id: canonicalNotionId(response.id, 'Markdown page ID'),
    markdown: response.markdown,
    truncated: response.truncated,
    unknown_block_ids: response.unknown_block_ids.map((id) =>
      canonicalNotionId(id, 'Unknown block ID'),
    ),
  }
}

function normalizeUnknownBlock(block: GetBlockResponse): GetBlockResponse {
  const stable = withoutRequestId(block)
  if (!('id' in stable) || typeof stable.id !== 'string') return stable
  return { ...stable, id: canonicalNotionId(stable.id, 'Unknown block ID') } as GetBlockResponse
}

export async function fetchNotionData(
  environment: NotionEnvironment,
  previousPages: ReadonlyMap<string, NotionPageSnapshot> = new Map(),
): Promise<FetchedNotionData> {
  const notion = createNotionClient(environment.token)
  const [contentPage, configPage] = await Promise.all([
    notionRequest(environment, 'Content page', 'retrieval', () =>
      notion.databases.retrieve({ database_id: environment.dbPageId }),
    ),
    notionRequest(environment, 'Config page', 'retrieval', () =>
      notion.databases.retrieve({ database_id: environment.configPageId }),
    ),
  ])
  if (!isFullDatabase(contentPage)) throw new Error('Content page retrieval returned partial data')
  if (!isFullDatabase(configPage)) throw new Error('Config page retrieval returned partial data')
  const contentDataSourceId = onlyDataSourceId('Content page', contentPage.data_sources)
  const configDataSourceId = onlyDataSourceId('Config page', configPage.data_sources)

  const [contentDataSource, configDataSource, contentResults, configResults] = await Promise.all([
    notionRequest(environment, 'Content data source', 'schema retrieval', () =>
      notion.dataSources.retrieve({ data_source_id: contentDataSourceId }),
    ),
    notionRequest(environment, 'Config data source', 'schema retrieval', () =>
      notion.dataSources.retrieve({ data_source_id: configDataSourceId }),
    ),
    notionRequest(environment, 'Content data source', 'paginated query', () =>
      collectAllDataSourceRows(notion, {
        data_source_id: contentDataSourceId,
      }),
    ),
    notionRequest(environment, 'Config data source', 'paginated query', () =>
      collectAllDataSourceRows(notion, { data_source_id: configDataSourceId }),
    ),
  ])

  const published = contentResults
    .map((result, index) => {
      if (!isFullPage(result))
        throw new Error(`Content query result ${index + 1} is not a complete page row`)
      return { page: result, status: publishedStatus(result, index) }
    })
    .filter(({ status }) => status === 'Published')
    .map(({ page }) => {
      const stable = withoutRequestId(page)
      return { ...stable, id: canonicalNotionId(stable.id) }
    })
    .sort((left, right) => left.id.localeCompare(right.id, 'en'))

  let reusedPages = 0
  const entries = await mapConcurrent(published, REQUEST_CONCURRENCY, async (page) => {
    const pageId = canonicalNotionId(page.id)
    const previous = previousPages.get(pageId)
    if (canReusePage(previous, page)) {
      reusedPages += 1
      return [pageId, { ...previous!, page }] as const
    }

    const response = await notionRequest(environment, `Page ${pageId}`, 'Markdown retrieval', () =>
      notion.pages.retrieveMarkdown({ page_id: pageId }),
    )
    const markdown = markdownSnapshot(response)
    const unknownBlocks = await mapConcurrent(
      markdown.unknown_block_ids,
      REQUEST_CONCURRENCY,
      async (blockId) =>
        normalizeUnknownBlock(
          await notionRequest(environment, `Page ${pageId}`, `block ${blockId} retrieval`, () =>
            notion.blocks.retrieve({ block_id: blockId }),
          ),
        ),
    )
    return [
      pageId,
      {
        schemaVersion: NOTION_SNAPSHOT_SCHEMA_VERSION,
        notionApiVersion: NOTION_API_VERSION,
        page,
        markdown,
        unknownBlocks,
      } satisfies NotionPageSnapshot,
    ] as const
  })

  const configRows = configResults.map((result, index) => {
    if (!isFullPage(result))
      throw new Error(`Config query result ${index + 1} is not a complete page row`)
    return withoutRequestId(result)
  })
  configRows.sort((left, right) => left.id.localeCompare(right.id, 'en'))

  return {
    config: {
      schemaVersion: NOTION_SNAPSHOT_SCHEMA_VERSION,
      notionApiVersion: NOTION_API_VERSION,
      contentDataSource: withoutRequestId(contentDataSource) as DataSourceObjectResponse,
      configDataSource: withoutRequestId(configDataSource) as DataSourceObjectResponse,
      configRows,
    },
    pages: new Map(entries),
    reusedPages,
  }
}