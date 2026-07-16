import {
  Client,
  collectAllDataSourceRows,
  isFullBlock,
  isFullPage,
  type DataSourceObjectResponse,
  type PageObjectResponse,
  type RichTextItemResponse,
} from '@notionhq/client'

import { parseMusubiMarkdown, type MusubiDocument } from '../../app/lib/content/index.ts'
import type { SourceConfigRow, SourceContentRow } from '../../app/lib/site/types.ts'
import { mapConcurrent } from './concurrency.ts'

export const NOTION_API_VERSION = '2026-03-11'
const REQUEST_CONCURRENCY = 4
const NOTION_SECRET_NAMES = [
  'NOTION_TOKEN',
  'NOTION_CONTENT_DATA_SOURCE_ID',
  'NOTION_CONFIG_DATA_SOURCE_ID',
] as const

export interface NotionEnvironment {
  token: string
  contentDataSourceId: string
  configDataSourceId: string
}

export interface LoadedNotionContent {
  row: SourceContentRow
  pageId: string
}

export interface LoadedNotionPage {
  row: SourceContentRow
  document: MusubiDocument
}

export interface LoadedNotionSources {
  content: LoadedNotionContent[]
  config: SourceConfigRow[]
}

export function readNotionEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): NotionEnvironment {
  const required = (
    name: 'NOTION_TOKEN' | 'NOTION_CONTENT_DATA_SOURCE_ID' | 'NOTION_CONFIG_DATA_SOURCE_ID',
  ): string => {
    const value = environment[name]?.trim()
    if (!value) {
      throw new Error(`Missing required build environment variable ${name}`)
    }
    return value
  }

  return {
    token: required('NOTION_TOKEN'),
    contentDataSourceId: required('NOTION_CONTENT_DATA_SOURCE_ID'),
    configDataSourceId: required('NOTION_CONFIG_DATA_SOURCE_ID'),
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
    // The SDK's default warning logger can include request parameters. Musubi
    // emits its own source-aware, redacted acquisition diagnostics instead.
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
      variants.add(
        `${rawId.slice(0, 8)}-${rawId.slice(8, 12)}-${rawId.slice(12, 16)}-${rawId.slice(16, 20)}-${rawId.slice(20)}`,
      )
    }
    for (const secret of variants) {
      redacted = redacted.replaceAll(secret, `[redacted ${name}]`)
    }
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
    NOTION_CONTENT_DATA_SOURCE_ID: environment.contentDataSourceId,
    NOTION_CONFIG_DATA_SOURCE_ID: environment.configDataSourceId,
  })
  return prefix ? `${prefix}: ${detail}` : detail
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

type ExpectedPropertyType =
  | 'title'
  | 'rich_text'
  | 'date'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'number'

function validateSourceProperties(
  source: DataSourceObjectResponse,
  sourceLabel: string,
  required: Readonly<Record<string, ExpectedPropertyType>>,
  optional: Readonly<Record<string, ExpectedPropertyType>> = {},
): void {
  for (const [name, expectedType] of Object.entries(required)) {
    const property = source.properties[name]
    if (!property) {
      throw new Error(`${sourceLabel} is missing required ${name} (${expectedType}) property`)
    }
    if (property.type !== expectedType) {
      throw new Error(`${sourceLabel}.${name} must be ${expectedType}, received ${property.type}`)
    }
  }
  for (const [name, expectedType] of Object.entries(optional)) {
    const property = source.properties[name]
    if (property && property.type !== expectedType) {
      throw new Error(
        `${sourceLabel}.${name} must be ${expectedType} when present, received ${property.type}`,
      )
    }
  }
}

function plainText(items: RichTextItemResponse[]): string {
  return items.map((item) => item.plain_text).join('')
}

export function normalizeNotionContentType(
  value: string | undefined,
  sourceLabel: string,
): SourceContentRow['type'] {
  if (value === 'Post' || value === 'Page') {
    return value
  }
  if (value === 'Content') {
    return 'Page'
  }
  throw new Error(`${sourceLabel}.Type must be Post or Page (legacy Content remains compatible)`)
}

function property(
  page: PageObjectResponse,
  name: string,
  expectedType: ExpectedPropertyType,
  sourceLabel: string,
): PageObjectResponse['properties'][string] {
  const value = page.properties[name]
  if (!value) {
    throw new Error(`${sourceLabel} is missing ${name} (${expectedType})`)
  }
  if (value.type !== expectedType) {
    throw new Error(`${sourceLabel}.${name} must be ${expectedType}, received ${value.type}`)
  }
  return value
}

function optionalProperty(
  page: PageObjectResponse,
  name: string,
  expectedType: ExpectedPropertyType,
  sourceLabel: string,
): PageObjectResponse['properties'][string] | undefined {
  const value = page.properties[name]
  if (!value) {
    return undefined
  }
  if (value.type !== expectedType) {
    throw new Error(`${sourceLabel}.${name} must be ${expectedType}, received ${value.type}`)
  }
  return value
}

function parseContentRow(page: PageObjectResponse, index: number): LoadedNotionContent {
  const initialLabel = `Content row ${index + 1}`
  const titleProperty = property(page, 'Title', 'title', initialLabel)
  const title = titleProperty.type === 'title' ? plainText(titleProperty.title) : ''
  const sourceLabel = title.trim()
    ? `${initialLabel} (${JSON.stringify(title.trim())})`
    : initialLabel
  const slugProperty = property(page, 'Slug', 'rich_text', sourceLabel)
  const dateProperty = property(page, 'Date', 'date', sourceLabel)
  const statusProperty = property(page, 'Status', 'select', sourceLabel)
  const typeProperty = property(page, 'Type', 'select', sourceLabel)
  const descriptionProperty = property(page, 'Description', 'rich_text', sourceLabel)
  const tagsProperty = property(page, 'Tags', 'multi_select', sourceLabel)
  const navigationVisibility = optionalProperty(page, 'ShowInNavigation', 'checkbox', sourceLabel)
  const navigationOrder = optionalProperty(page, 'NavigationOrder', 'number', sourceLabel)

  const status = statusProperty.type === 'select' ? statusProperty.select?.name : undefined
  if (status !== 'Draft' && status !== 'Published') {
    throw new Error(`${sourceLabel}.Status must be Draft or Published`)
  }
  const type = normalizeNotionContentType(
    typeProperty.type === 'select' ? typeProperty.select?.name : undefined,
    sourceLabel,
  )
  const order = navigationOrder?.type === 'number' ? navigationOrder.number : undefined
  if (order !== undefined && order !== null && !Number.isFinite(order)) {
    throw new Error(`${sourceLabel}.NavigationOrder must be a finite number`)
  }

  return {
    pageId: page.id,
    row: {
      sourceLabel,
      title,
      slug: slugProperty.type === 'rich_text' ? plainText(slugProperty.rich_text) : '',
      date: dateProperty.type === 'date' ? dateProperty.date?.start : undefined,
      status,
      type,
      description:
        descriptionProperty.type === 'rich_text' ? plainText(descriptionProperty.rich_text) : '',
      tags:
        tagsProperty.type === 'multi_select'
          ? tagsProperty.multi_select.map((tag) => tag.name)
          : [],
      showInNavigation:
        navigationVisibility?.type === 'checkbox' ? navigationVisibility.checkbox : undefined,
      navigationOrder: order ?? undefined,
    },
  }
}

function parseConfigRow(page: PageObjectResponse, index: number): SourceConfigRow {
  const initialLabel = `Config row ${index + 1}`
  const descriptionProperty = property(page, 'Description', 'title', initialLabel)
  const description =
    descriptionProperty.type === 'title' ? plainText(descriptionProperty.title) : ''
  const sourceLabel = description.trim()
    ? `${initialLabel} (${JSON.stringify(description.trim())})`
    : initialLabel
  const keyProperty = property(page, 'Key', 'select', sourceLabel)
  const valueProperty = property(page, 'Value', 'rich_text', sourceLabel)
  const enabledProperty = property(page, 'Enable', 'checkbox', sourceLabel)

  return {
    sourceLabel,
    key: keyProperty.type === 'select' ? (keyProperty.select?.name ?? '') : '',
    value: valueProperty.type === 'rich_text' ? plainText(valueProperty.rich_text) : '',
    enabled: enabledProperty.type === 'checkbox' && enabledProperty.checkbox,
  }
}

export async function loadNotionSources(
  environment: NotionEnvironment,
): Promise<LoadedNotionSources> {
  const notion = createNotionClient(environment.token)
  const [contentSource, configSource] = await Promise.all([
    notionRequest(environment, 'Content data source', 'schema retrieval', () =>
      notion.dataSources.retrieve({ data_source_id: environment.contentDataSourceId }),
    ),
    notionRequest(environment, 'Config data source', 'schema retrieval', () =>
      notion.dataSources.retrieve({ data_source_id: environment.configDataSourceId }),
    ),
  ])

  validateSourceProperties(
    contentSource,
    'Content data source',
    {
      Title: 'title',
      Slug: 'rich_text',
      Date: 'date',
      Status: 'select',
      Type: 'select',
      Description: 'rich_text',
      Tags: 'multi_select',
    },
    { ShowInNavigation: 'checkbox', NavigationOrder: 'number' },
  )
  validateSourceProperties(configSource, 'Config data source', {
    Description: 'title',
    Key: 'select',
    Value: 'rich_text',
    Enable: 'checkbox',
  })

  const [contentResults, configResults] = await Promise.all([
    notionRequest(environment, 'Content data source', 'paginated query', () =>
      collectAllDataSourceRows(notion, { data_source_id: environment.contentDataSourceId }),
    ),
    notionRequest(environment, 'Config data source', 'paginated query', () =>
      collectAllDataSourceRows(notion, { data_source_id: environment.configDataSourceId }),
    ),
  ])

  const content = contentResults.map((result, index) => {
    if (!isFullPage(result)) {
      throw new Error(`Content query result ${index + 1} is not a complete page row`)
    }
    return parseContentRow(result, index)
  })
  const config = configResults.map((result, index) => {
    if (!isFullPage(result)) {
      throw new Error(`Config query result ${index + 1} is not a complete page row`)
    }
    return parseConfigRow(result, index)
  })

  return { content, config }
}

async function resolveEmbeds(
  notion: Client,
  environment: NotionEnvironment,
  blockIds: readonly string[],
  pageLabel: string,
): Promise<Map<string, string>> {
  const entries = await mapConcurrent(blockIds, REQUEST_CONCURRENCY, async (blockId) => {
    const block = await notionRequest(
      environment,
      pageLabel,
      `embed block ${blockId} retrieval`,
      () => notion.blocks.retrieve({ block_id: blockId }),
    )
    if (!isFullBlock(block) || block.type !== 'embed') {
      const type = isFullBlock(block) ? block.type : 'partial block'
      throw new Error(
        `${pageLabel}: unknown block ${blockId} is required ${type}, not a supported embed`,
      )
    }
    return [block.id, block.embed.url] as const
  })
  return new Map(entries)
}

function collectResolvedEmbedIds(document: MusubiDocument): Set<string> {
  const ids = new Set<string>()
  const visit = (blocks: MusubiDocument['children']): void => {
    for (const block of blocks) {
      if (block.type === 'xEmbed' && block.sourceBlockId) {
        ids.add(block.sourceBlockId)
      } else if (block.type === 'list') {
        for (const item of block.children) {
          visit(item.children)
        }
      } else if (block.type === 'quote' || block.type === 'callout') {
        visit(block.children)
      }
    }
  }
  visit(document.children)
  return ids
}

export async function loadPublishedNotionPages(
  environment: NotionEnvironment,
  content: readonly LoadedNotionContent[],
): Promise<LoadedNotionPage[]> {
  const notion = createNotionClient(environment.token)
  const published = content.filter(({ row }) => row.status === 'Published')

  return mapConcurrent(published, REQUEST_CONCURRENCY, async ({ pageId, row }) => {
    const response = await notionRequest(environment, row.sourceLabel, 'Markdown retrieval', () =>
      notion.pages.retrieveMarkdown({ page_id: pageId }),
    )
    if (response.truncated && response.unknown_block_ids.length === 0) {
      throw new Error(
        `${row.sourceLabel}: Notion marked the Markdown response truncated without identifying recoverable source blocks`,
      )
    }
    const embedUrlsByBlockId = await resolveEmbeds(
      notion,
      environment,
      response.unknown_block_ids,
      row.sourceLabel,
    )
    const document = parseMusubiMarkdown(response.markdown, {
      pageLabel: row.sourceLabel,
      embedUrlsByBlockId,
    })
    const resolvedEmbedIds = collectResolvedEmbedIds(document)
    const unresolvedIds = response.unknown_block_ids.filter(
      (blockId) => !resolvedEmbedIds.has(blockId),
    )
    if (unresolvedIds.length > 0) {
      throw new Error(
        `${row.sourceLabel}: Notion returned truncated or unknown Markdown blocks that were not represented in the parsed document`,
      )
    }
    if (response.truncated && resolvedEmbedIds.size !== response.unknown_block_ids.length) {
      throw new Error(
        `${row.sourceLabel}: Notion truncation was not fully explained by represented optional embed blocks`,
      )
    }
    return {
      row,
      document,
    }
  })
}