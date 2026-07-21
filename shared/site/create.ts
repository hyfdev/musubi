import { parseMusubiMarkdown } from '../content/parse.ts'
import { highlightDocuments } from '../content/highlight.ts'
import type { MusubiDocument } from '../content/types.ts'
import { resolveSiteConfig } from './config.ts'
import { buildRouteManifest } from './routes.ts'
import type {
  LoadedNotionPageSnapshot,
  NotionDataSnapshot,
  NotionMarkdownSnapshot,
} from '../../scripts/notion/types.ts'
import { NOTION_SNAPSHOT_SCHEMA_VERSION } from '../../scripts/notion/types.ts'
import type {
  Home,
  Page,
  Post,
  PublishedPageMeta,
  Site,
  SiteContent,
  SourceConfigRow,
  SourceContentRow,
} from './types.ts'

type ExpectedPropertyType =
  | 'title'
  | 'rich_text'
  | 'date'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'number'

interface ParsedContentRow {
  pageId: string
  row: SourceContentRow
}

interface ResolvedProperty {
  name: string
  value: Record<string, unknown>
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`)
  return value
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`)
  return value
}

function validateSnapshotEnvelope(snapshot: NotionDataSnapshot): void {
  const version = snapshot.config.schemaVersion
  if (version !== NOTION_SNAPSHOT_SCHEMA_VERSION) {
    throw new Error(
      `${snapshot.configFilename}: unsupported Notion Data schema version ${String(version)}`,
    )
  }
  if (!snapshot.config.notionApiVersion.trim()) {
    throw new Error(`${snapshot.configFilename}: notionApiVersion must be nonempty`)
  }
  for (const page of snapshot.pages) {
    if (page.data.schemaVersion !== version) {
      throw new Error(`${page.filename}: schemaVersion does not match config.json`)
    }
    if (page.data.notionApiVersion !== snapshot.config.notionApiVersion) {
      throw new Error(`${page.filename}: notionApiVersion does not match config.json`)
    }
  }
}

function sourceProperties(source: unknown, label: string): Record<string, unknown> {
  const value = object(source, label)
  if (value.object !== 'data_source') throw new Error(`${label}.object must be data_source`)
  return object(value.properties, `${label}.properties`)
}

function validateSourceProperties(
  source: unknown,
  sourceLabel: string,
  required: Readonly<Record<string, ExpectedPropertyType>>,
  optional: Readonly<Record<string, ExpectedPropertyType>> = {},
): void {
  const properties = sourceProperties(source, sourceLabel)
  for (const [name, expectedType] of Object.entries(required)) {
    const propertyValue = properties[name]
    if (!propertyValue) {
      throw new Error(`${sourceLabel} is missing required ${name} (${expectedType}) property`)
    }
    const property = object(propertyValue, `${sourceLabel}.${name}`)
    if (property.type !== expectedType) {
      throw new Error(
        `${sourceLabel}.${name} must be ${expectedType}, received ${String(property.type)}`,
      )
    }
  }
  for (const [name, expectedType] of Object.entries(optional)) {
    const propertyValue = properties[name]
    if (!propertyValue) continue
    const property = object(propertyValue, `${sourceLabel}.${name}`)
    if (property.type !== expectedType) {
      throw new Error(
        `${sourceLabel}.${name} must be ${expectedType} when present, received ${String(property.type)}`,
      )
    }
  }
}

function pageProperties(value: unknown, sourceLabel: string): Record<string, unknown> {
  const page = object(value, sourceLabel)
  if (page.object !== 'page') throw new Error(`${sourceLabel}.object must be page`)
  string(page.id, `${sourceLabel}.id`)
  return object(page.properties, `${sourceLabel}.properties`)
}

function property(
  properties: Record<string, unknown>,
  name: string,
  expectedType: ExpectedPropertyType,
  sourceLabel: string,
): Record<string, unknown> {
  const value = properties[name]
  if (!value) throw new Error(`${sourceLabel} is missing ${name} (${expectedType})`)
  const result = object(value, `${sourceLabel}.${name}`)
  if (result.type !== expectedType) {
    throw new Error(
      `${sourceLabel}.${name} must be ${expectedType}, received ${String(result.type)}`,
    )
  }
  return result
}

function optionalProperty(
  properties: Record<string, unknown>,
  name: string,
  expectedType: ExpectedPropertyType,
  sourceLabel: string,
): Record<string, unknown> | undefined {
  const value = properties[name]
  if (!value) return undefined
  const result = object(value, `${sourceLabel}.${name}`)
  if (result.type !== expectedType) {
    throw new Error(
      `${sourceLabel}.${name} must be ${expectedType} when present, received ${String(result.type)}`,
    )
  }
  return result
}

function aliasedProperty(
  properties: Record<string, unknown>,
  names: readonly string[],
  expectedType: ExpectedPropertyType,
  sourceLabel: string,
  required = true,
): ResolvedProperty | undefined {
  const matches = names.filter((name) => properties[name] !== undefined)
  const canonicalName = names[0]!
  if (matches.length > 1) {
    throw new Error(
      `${sourceLabel} has conflicting ${matches.join(' and ')} properties; keep only ${canonicalName}`,
    )
  }
  const name = matches[0]
  if (!name) {
    if (!required) return undefined
    throw new Error(`${sourceLabel} is missing ${canonicalName} (${expectedType})`)
  }
  const value = object(properties[name], `${sourceLabel}.${name}`)
  if (value.type !== expectedType) {
    const qualifier = required ? '' : ' when present'
    throw new Error(
      `${sourceLabel}.${name} must be ${expectedType}${qualifier}, received ${String(value.type)}`,
    )
  }
  return { name, value }
}

function validateAliasedSourceProperty(
  source: unknown,
  sourceLabel: string,
  names: readonly string[],
  expectedType: ExpectedPropertyType,
  required = true,
): void {
  aliasedProperty(sourceProperties(source, sourceLabel), names, expectedType, sourceLabel, required)
}

function richTextPlainText(value: unknown, label: string): string {
  return array(value, label)
    .map((item, index) =>
      string(object(item, `${label}[${index}]`).plain_text, `${label}[${index}].plain_text`),
    )
    .join('')
}

export function normalizeNotionContentType(
  value: string | undefined,
  sourceLabel: string,
): SourceContentRow['type'] {
  if (value === 'Post' || value === 'Page' || value === 'Home') return value
  if (value === 'Content') return 'Page'
  throw new Error(
    `${sourceLabel}.Type must be Post, Page, or Home (legacy Content remains compatible)`,
  )
}

function selectName(value: Record<string, unknown>, label: string): string | undefined {
  if (value.select === null) return undefined
  return string(object(value.select, `${label}.select`).name, `${label}.select.name`)
}

function parseContentRow(snapshot: LoadedNotionPageSnapshot): ParsedContentRow {
  const page = object(snapshot.data.page, snapshot.filename)
  const pageId = string(page.id, `${snapshot.filename}.page.id`)
  const properties = pageProperties(page, `${snapshot.filename}.page`)
  const titleProperty = property(properties, 'Title', 'title', snapshot.filename)
  const title = richTextPlainText(titleProperty.title, `${snapshot.filename}.Title.title`)
  const sourceLabel = title.trim()
    ? `${snapshot.filename} (${JSON.stringify(title.trim())})`
    : snapshot.filename
  const slugProperty = property(properties, 'Slug', 'rich_text', sourceLabel)
  const dateProperty = aliasedProperty(properties, ['Publish Date', 'Date'], 'date', sourceLabel)!
  const statusProperty = property(properties, 'Status', 'select', sourceLabel)
  const typeProperty = property(properties, 'Type', 'select', sourceLabel)
  const descriptionProperty = property(properties, 'Description', 'rich_text', sourceLabel)
  const tagsProperty = optionalProperty(properties, 'Tags', 'multi_select', sourceLabel)
  const navigationVisibility = aliasedProperty(
    properties,
    ['Show in Navigation', 'ShowInNavigation'],
    'checkbox',
    sourceLabel,
    false,
  )
  const navigationOrder = aliasedProperty(
    properties,
    ['Navigation Order', 'NavigationOrder'],
    'number',
    sourceLabel,
    false,
  )

  const status = selectName(statusProperty, `${sourceLabel}.Status`)
  if (status !== 'Published') {
    throw new Error(`${sourceLabel}.Status must be Published in the persisted snapshot`)
  }
  const type = normalizeNotionContentType(
    selectName(typeProperty, `${sourceLabel}.Type`),
    sourceLabel,
  )
  const dateValue = dateProperty.value.date
  const date =
    dateValue === null
      ? undefined
      : string(
          object(dateValue, `${sourceLabel}.${dateProperty.name}.date`).start,
          `${sourceLabel}.${dateProperty.name}.date.start`,
        )
  const tagValues = tagsProperty
    ? array(tagsProperty.multi_select, `${sourceLabel}.Tags.multi_select`).map((tag, index) =>
        string(
          object(tag, `${sourceLabel}.Tags.multi_select[${index}]`).name,
          `${sourceLabel}.Tags.multi_select[${index}].name`,
        ),
      )
    : []
  const order = navigationOrder?.value.number
  if (
    order !== undefined &&
    order !== null &&
    (typeof order !== 'number' || !Number.isFinite(order))
  ) {
    throw new Error(`${sourceLabel}.Navigation Order must be a finite number`)
  }

  return {
    pageId,
    row: {
      sourceLabel,
      title,
      slug: richTextPlainText(slugProperty.rich_text, `${sourceLabel}.Slug.rich_text`),
      date,
      status,
      type,
      description: richTextPlainText(
        descriptionProperty.rich_text,
        `${sourceLabel}.Description.rich_text`,
      ),
      tags: tagValues,
      showInNavigation:
        navigationVisibility === undefined
          ? undefined
          : navigationVisibility.value.checkbox === true,
      navigationOrder: typeof order === 'number' ? order : undefined,
    },
  }
}

function parseConfigRow(value: unknown, index: number, filename: string): SourceConfigRow {
  const initialLabel = `${filename}.configRows[${index}]`
  const properties = pageProperties(value, initialLabel)
  const helpProperty = aliasedProperty(properties, ['Help', 'Description'], 'title', initialLabel)!
  const description = richTextPlainText(
    helpProperty.value.title,
    `${initialLabel}.${helpProperty.name}.title`,
  )
  const sourceLabel = description.trim()
    ? `${initialLabel} (${JSON.stringify(description.trim())})`
    : initialLabel
  const keyProperty = property(properties, 'Key', 'select', sourceLabel)
  const valueProperty = property(properties, 'Value', 'rich_text', sourceLabel)
  const enabledProperty = property(properties, 'Enable', 'checkbox', sourceLabel)

  return {
    sourceLabel,
    key: selectName(keyProperty, `${sourceLabel}.Key`) ?? '',
    value: richTextPlainText(valueProperty.rich_text, `${sourceLabel}.Value.rich_text`),
    enabled: enabledProperty.checkbox === true,
  }
}

function validateMarkdown(value: NotionMarkdownSnapshot, filename: string, pageId: string): void {
  if (value.object !== 'page_markdown') {
    throw new Error(`${filename}.markdown.object must be page_markdown`)
  }
  if (value.id !== pageId) throw new Error(`${filename}.markdown.id does not match page.id`)
  if (typeof value.markdown !== 'string')
    throw new Error(`${filename}.markdown.markdown must be a string`)
  if (typeof value.truncated !== 'boolean') {
    throw new Error(`${filename}.markdown.truncated must be a boolean`)
  }
  if (
    !Array.isArray(value.unknown_block_ids) ||
    value.unknown_block_ids.some((id) => typeof id !== 'string')
  ) {
    throw new Error(`${filename}.markdown.unknown_block_ids must be an array of strings`)
  }
  if (value.truncated && value.unknown_block_ids.length === 0) {
    throw new Error(
      `${filename}: Notion marked Markdown truncated without identifying source blocks`,
    )
  }
}

function embedUrls(page: LoadedNotionPageSnapshot, pageId: string): Map<string, string> {
  validateMarkdown(page.data.markdown, page.filename, pageId)
  const byId = new Map<string, Record<string, unknown>>()
  for (const [index, value] of page.data.unknownBlocks.entries()) {
    const block = object(value, `${page.filename}.unknownBlocks[${index}]`)
    const id = string(block.id, `${page.filename}.unknownBlocks[${index}].id`)
    if (byId.has(id)) throw new Error(`${page.filename}: duplicate unknown block ${id}`)
    byId.set(id, block)
  }

  const result = new Map<string, string>()
  for (const id of page.data.markdown.unknown_block_ids) {
    const block = byId.get(id)
    if (!block) throw new Error(`${page.filename}: missing retrieved unknown block ${id}`)
    if (block.object !== 'block' || block.type !== 'embed') continue
    const embed = object(block.embed, `${page.filename}.unknownBlocks.${id}.embed`)
    result.set(id, string(embed.url, `${page.filename}.unknownBlocks.${id}.embed.url`))
  }
  return result
}

function createContent(meta: PublishedPageMeta, document: MusubiDocument): SiteContent {
  const common = {
    sourceLabel: meta.sourceLabel,
    title: meta.title,
    slug: meta.slug,
    route: meta.route,
    description: meta.description,
    tags: meta.tags,
    document,
  }
  if (meta.type === 'Post') {
    return { ...common, type: 'Post', date: meta.date! }
  }
  if (meta.type === 'Home') {
    return { ...common, type: 'Home' }
  }
  return {
    ...common,
    type: 'Page',
    showInNavigation: meta.showInNavigation,
    navigationOrder: meta.navigationOrder,
  }
}

export async function createSite(
  snapshot: NotionDataSnapshot,
  publicFiles: string[] = [],
): Promise<Site> {
  validateSnapshotEnvelope(snapshot)
  validateSourceProperties(
    snapshot.config.contentDataSource,
    `${snapshot.configFilename}.contentDataSource`,
    {
      Title: 'title',
      Slug: 'rich_text',
      Status: 'select',
      Type: 'select',
      Description: 'rich_text',
    },
    { Tags: 'multi_select' },
  )
  validateAliasedSourceProperty(
    snapshot.config.contentDataSource,
    `${snapshot.configFilename}.contentDataSource`,
    ['Publish Date', 'Date'],
    'date',
  )
  validateAliasedSourceProperty(
    snapshot.config.contentDataSource,
    `${snapshot.configFilename}.contentDataSource`,
    ['Show in Navigation', 'ShowInNavigation'],
    'checkbox',
    false,
  )
  validateAliasedSourceProperty(
    snapshot.config.contentDataSource,
    `${snapshot.configFilename}.contentDataSource`,
    ['Navigation Order', 'NavigationOrder'],
    'number',
    false,
  )
  validateSourceProperties(
    snapshot.config.configDataSource,
    `${snapshot.configFilename}.configDataSource`,
    {
      Key: 'select',
      Value: 'rich_text',
      Enable: 'checkbox',
    },
  )
  validateAliasedSourceProperty(
    snapshot.config.configDataSource,
    `${snapshot.configFilename}.configDataSource`,
    ['Help', 'Description'],
    'title',
  )

  const configRows = snapshot.config.configRows.map((row, index) =>
    parseConfigRow(row, index, snapshot.configFilename),
  )
  const parsedPages = snapshot.pages.map(parseContentRow)
  const routeManifest = buildRouteManifest(
    parsedPages.map(({ row }) => row),
    publicFiles,
  )
  const metadataBySource = new Map(
    [
      ...routeManifest.posts,
      ...routeManifest.standalonePages,
      ...(routeManifest.home ? [routeManifest.home] : []),
    ].map((meta) => [meta.sourceLabel, meta]),
  )
  const parsedDocuments = snapshot.pages.map((page, index) => {
    const parsed = parsedPages[index]!
    const meta = metadataBySource.get(parsed.row.sourceLabel)
    if (!meta) throw new Error(`${page.filename}: page is absent from the route manifest`)
    return {
      meta,
      document: parseMusubiMarkdown(page.data.markdown.markdown, {
        pageLabel: parsed.row.sourceLabel,
        embedUrlsByBlockId: embedUrls(page, parsed.pageId),
      }),
    }
  })
  const highlighted = await highlightDocuments(parsedDocuments.map(({ document }) => document))
  const contents = parsedDocuments.map(({ meta }, index) =>
    createContent(meta, highlighted[index]!),
  )
  const byRoute = new Map(contents.map((content) => [content.route, content]))
  const posts = routeManifest.posts.map((meta) => byRoute.get(meta.route) as Post)
  const pages = routeManifest.standalonePages.map((meta) => byRoute.get(meta.route) as Page)
  const home = routeManifest.home ? (byRoute.get(routeManifest.home.route) as Home) : undefined

  return {
    config: resolveSiteConfig(configRows),
    posts,
    pages,
    home,
    navigation: routeManifest.navigation,
    byRoute,
    routes: routeManifest.routes,
  }
}