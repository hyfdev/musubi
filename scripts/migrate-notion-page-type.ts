import {
  collectAllDataSourceRows,
  isFullPage,
  type Client,
  type DataSourceObjectResponse,
  type PageObjectResponse,
  type RichTextItemResponse,
} from '@notionhq/client'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  createNotionClient,
  NOTION_API_VERSION,
  readNotionEnvironment,
  redactNotionSecrets,
  type NotionEnvironment,
} from './lib/notion.ts'

const projectRoot = resolve(import.meta.dirname, '..')
const migrationDirectory = resolve(projectRoot, '.musubi/notion-migrations')
const expectedProductionHost = 'musubi.hyf.me'

interface MigrationOptions {
  apply: boolean
  rollbackPath?: string
  draftPageSlugs: string[]
}

interface MigrationSnapshot {
  schemaVersion: 1
  capturedAt: string
  notionApiVersion: string
  target: {
    title: string
    link: string
  }
  contentSource: DataSourceObjectResponse
  configSource: DataSourceObjectResponse
  contentRows: PageObjectResponse[]
  configRows: PageObjectResponse[]
  pageMarkdown: Record<
    string,
    {
      markdown: string
      truncated: boolean
      unknownBlockIds: string[]
    }
  >
  applied?: {
    completedAt: string
    draftPageSlugs: string[]
    createdConfigPageIds: string[]
    migratedLegacyRows: number
  }
}

interface SourceState {
  contentSource: DataSourceObjectResponse
  configSource: DataSourceObjectResponse
  contentRows: PageObjectResponse[]
  configRows: PageObjectResponse[]
}

function parseOptions(arguments_: string[]): MigrationOptions {
  let apply = false
  let rollbackPath: string | undefined
  const draftPageSlugs: string[] = []

  for (const argument of arguments_) {
    if (argument === '--') {
      continue
    }
    if (argument === '--apply') {
      apply = true
      continue
    }
    if (argument.startsWith('--rollback=')) {
      rollbackPath = argument.slice('--rollback='.length).trim()
      continue
    }
    if (argument.startsWith('--draft-page=')) {
      const slug = argument.slice('--draft-page='.length).trim().normalize('NFC')
      if (!slug) throw new Error('--draft-page requires a nonempty slug')
      draftPageSlugs.push(slug)
      continue
    }
    throw new Error(`Unknown argument ${JSON.stringify(argument)}`)
  }

  if (apply && rollbackPath) {
    throw new Error('Choose either --apply or --rollback, not both')
  }
  return { apply, rollbackPath, draftPageSlugs: [...new Set(draftPageSlugs)] }
}

function plainText(items: RichTextItemResponse[]): string {
  return items.map((item) => item.plain_text).join('')
}

function pageTitle(page: PageObjectResponse): string {
  const value = page.properties.Title ?? page.properties.Description
  if (!value || (value.type !== 'title' && value.type !== 'rich_text')) return ''
  return value.type === 'title' ? plainText(value.title) : plainText(value.rich_text)
}

function richText(page: PageObjectResponse, name: string): string {
  const value = page.properties[name]
  return value?.type === 'rich_text' ? plainText(value.rich_text) : ''
}

function selectName(page: PageObjectResponse, name: string): string | undefined {
  const value = page.properties[name]
  return value?.type === 'select' ? value.select?.name : undefined
}

function checkboxValue(page: PageObjectResponse, name: string): boolean | undefined {
  const value = page.properties[name]
  return value?.type === 'checkbox' ? value.checkbox : undefined
}

function numberValue(page: PageObjectResponse, name: string): number | null | undefined {
  const value = page.properties[name]
  return value?.type === 'number' ? value.number : undefined
}

function sourceLabel(page: PageObjectResponse, index: number, source: string): string {
  const title = pageTitle(page).trim()
  return title
    ? `${source} row ${index + 1} (${JSON.stringify(title)})`
    : `${source} row ${index + 1}`
}

async function request<T>(
  environment: NotionEnvironment,
  description: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${description} failed: ${redactNotionSecrets(message)}`, { cause: error })
  }
}

async function readRows(
  notion: Client,
  environment: NotionEnvironment,
  dataSourceId: string,
  label: string,
): Promise<PageObjectResponse[]> {
  const results = await request(environment, `${label} query`, () =>
    collectAllDataSourceRows(notion, { data_source_id: dataSourceId }),
  )
  return results.map((result, index) => {
    if (!isFullPage(result)) {
      throw new Error(`${label} result ${index + 1} is not a complete page row`)
    }
    return result
  })
}

async function readState(notion: Client, environment: NotionEnvironment): Promise<SourceState> {
  const [contentSource, configSource, contentRows, configRows] = await Promise.all([
    request(environment, 'Content data source retrieval', () =>
      notion.dataSources.retrieve({ data_source_id: environment.contentDataSourceId }),
    ),
    request(environment, 'Config data source retrieval', () =>
      notion.dataSources.retrieve({ data_source_id: environment.configDataSourceId }),
    ),
    readRows(notion, environment, environment.contentDataSourceId, 'Content data source'),
    readRows(notion, environment, environment.configDataSourceId, 'Config data source'),
  ])
  return { contentSource, configSource, contentRows, configRows }
}

function configValue(rows: PageObjectResponse[], key: string): string | undefined {
  const matches = rows.filter(
    (row) => selectName(row, 'Key') === key && checkboxValue(row, 'Enable') === true,
  )
  if (matches.length > 1) {
    throw new Error(`Config source has duplicate enabled ${key} rows`)
  }
  return matches[0] ? richText(matches[0], 'Value').trim() : undefined
}

function verifyTarget(state: SourceState): { title: string; link: string } {
  const title = configValue(state.configRows, 'Title')
  const link = configValue(state.configRows, 'Link')
  if (!title || !link) {
    throw new Error('The selected Config source must provide enabled Title and Link rows')
  }
  let host: string
  try {
    host = new URL(link).hostname.toLowerCase()
  } catch {
    throw new Error('The selected Config Link is not a valid absolute URL')
  }
  if (title !== 'Musubi' || host !== expectedProductionHost) {
    throw new Error(
      `Refusing to migrate an unrelated Notion source: expected Musubi at ${expectedProductionHost}`,
    )
  }
  return { title, link }
}

function propertyOptions(
  source: DataSourceObjectResponse,
  propertyName: string,
): Array<{ id: string; name: string; color: string; description: string | null }> {
  const property = source.properties[propertyName]
  if (!property || property.type !== 'select') {
    throw new Error(`${propertyName} must be a select property before migration`)
  }
  return property.select.options
}

function hasProperty(
  source: DataSourceObjectResponse,
  name: string,
  type: 'checkbox' | 'number',
): boolean {
  const property = source.properties[name]
  if (!property) return false
  if (property.type !== type) {
    throw new Error(`${name} must be ${type} when present`)
  }
  return true
}

function richTextRequest(value: string) {
  return [{ type: 'text' as const, text: { content: value } }]
}

function snapshotFilename(prefix: string): string {
  return `${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}-${prefix}.json`
}

async function writeSnapshot(snapshot: MigrationSnapshot, path?: string): Promise<string> {
  await mkdir(migrationDirectory, { recursive: true, mode: 0o700 })
  const outputPath = path ?? resolve(migrationDirectory, snapshotFilename('content-to-page'))
  await writeFile(outputPath, `${JSON.stringify(snapshot, undefined, 2)}\n`, {
    mode: 0o600,
  })
  return outputPath
}

async function captureSnapshot(
  notion: Client,
  environment: NotionEnvironment,
  state: SourceState,
  target: { title: string; link: string },
  prefix = 'content-to-page',
): Promise<{ snapshot: MigrationSnapshot; path: string }> {
  const pageMarkdown: MigrationSnapshot['pageMarkdown'] = {}
  for (const page of state.contentRows) {
    const response = await request(environment, 'Content page Markdown snapshot', () =>
      notion.pages.retrieveMarkdown({ page_id: page.id }),
    )
    pageMarkdown[page.id] = {
      markdown: response.markdown,
      truncated: response.truncated,
      unknownBlockIds: response.unknown_block_ids,
    }
  }
  const snapshot: MigrationSnapshot = {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    notionApiVersion: NOTION_API_VERSION,
    target,
    ...state,
    pageMarkdown,
  }
  const path = await writeSnapshot(snapshot, resolve(migrationDirectory, snapshotFilename(prefix)))
  return { snapshot, path }
}

function matchingPageBySlug(
  rows: PageObjectResponse[],
  slug: string,
): PageObjectResponse | undefined {
  return rows.find((row) => richText(row, 'Slug').trim().normalize('NFC') === slug)
}

async function ensureContentSchema(
  notion: Client,
  environment: NotionEnvironment,
  source: DataSourceObjectResponse,
): Promise<void> {
  const typeOptions = propertyOptions(source, 'Type')
  const properties: Record<string, unknown> = {}
  if (!typeOptions.some((option) => option.name === 'Page')) {
    properties.Type = {
      select: {
        options: [
          ...typeOptions.map((option) => ({ id: option.id })),
          { name: 'Page', color: 'yellow' },
        ],
      },
    }
  }
  if (!hasProperty(source, 'ShowInNavigation', 'checkbox')) {
    properties.ShowInNavigation = { checkbox: {} }
  }
  if (!hasProperty(source, 'NavigationOrder', 'number')) {
    properties.NavigationOrder = { number: {} }
  }
  if (Object.keys(properties).length === 0) return

  await request(environment, 'Content schema update', () =>
    notion.dataSources.update({
      data_source_id: environment.contentDataSourceId,
      properties,
    }),
  )
}

async function ensureConfigSchema(
  notion: Client,
  environment: NotionEnvironment,
  source: DataSourceObjectResponse,
): Promise<void> {
  const options = propertyOptions(source, 'Key')
  if (options.some((option) => option.name === 'Timezone')) return
  await request(environment, 'Config schema update', () =>
    notion.dataSources.update({
      data_source_id: environment.configDataSourceId,
      properties: {
        Key: {
          select: {
            options: [
              ...options.map((option) => ({ id: option.id })),
              { name: 'Timezone', color: 'gray' },
            ],
          },
        },
      },
    }),
  )
}

async function migrateRows(
  notion: Client,
  environment: NotionEnvironment,
  state: SourceState,
  draftPageSlugs: string[],
): Promise<{ migratedLegacyRows: number; createdConfigPageIds: string[] }> {
  let migratedLegacyRows = 0
  for (const [index, page] of state.contentRows.entries()) {
    if (selectName(page, 'Type') !== 'Content') continue
    await request(environment, `${sourceLabel(page, index, 'Content')} Type migration`, () =>
      notion.pages.update({
        page_id: page.id,
        properties: { Type: { select: { name: 'Page' } } },
      }),
    )
    migratedLegacyRows += 1
  }

  for (const slug of draftPageSlugs) {
    const page = matchingPageBySlug(state.contentRows, slug)
    if (!page) {
      throw new Error(`Cannot draft missing Page slug ${JSON.stringify(slug)}`)
    }
    if (selectName(page, 'Type') !== 'Content' && selectName(page, 'Type') !== 'Page') {
      throw new Error(`Cannot draft ${JSON.stringify(slug)} because it is not a standalone Page`)
    }
    if (selectName(page, 'Status') !== 'Draft') {
      await request(environment, `Draft Page ${JSON.stringify(slug)}`, () =>
        notion.pages.update({
          page_id: page.id,
          properties: { Status: { select: { name: 'Draft' } } },
        }),
      )
    }
  }

  const timezoneRows = state.configRows.filter((row) => selectName(row, 'Key') === 'Timezone')
  if (timezoneRows.length > 1) {
    throw new Error('Config source has duplicate Timezone rows')
  }
  const createdConfigPageIds: string[] = []
  const timezone = timezoneRows[0]
  if (timezone) {
    const alreadyCorrect =
      checkboxValue(timezone, 'Enable') === true &&
      richText(timezone, 'Value').trim() === 'Asia/Singapore'
    if (!alreadyCorrect) {
      await request(environment, 'Timezone Config row update', () =>
        notion.pages.update({
          page_id: timezone.id,
          properties: {
            Value: { rich_text: richTextRequest('Asia/Singapore') },
            Enable: { checkbox: true },
          },
        }),
      )
    }
  } else {
    const created = await request(environment, 'Timezone Config row creation', () =>
      notion.pages.create({
        parent: { data_source_id: environment.configDataSourceId },
        properties: {
          Description: { title: richTextRequest('Publication timezone') },
          Key: { select: { name: 'Timezone' } },
          Value: { rich_text: richTextRequest('Asia/Singapore') },
          Enable: { checkbox: true },
        },
      }),
    )
    createdConfigPageIds.push(created.id)
  }

  return { migratedLegacyRows, createdConfigPageIds }
}

function verifyMigratedState(state: SourceState, draftPageSlugs: string[]): void {
  const typeOptions = propertyOptions(state.contentSource, 'Type').map((option) => option.name)
  for (const required of ['Post', 'Content', 'Page']) {
    if (!typeOptions.includes(required)) {
      throw new Error(`Migrated Type options are missing ${required}`)
    }
  }
  hasProperty(state.contentSource, 'ShowInNavigation', 'checkbox')
  hasProperty(state.contentSource, 'NavigationOrder', 'number')
  if (state.contentRows.some((row) => selectName(row, 'Type') === 'Content')) {
    throw new Error('At least one legacy Content row remains after migration')
  }
  for (const slug of draftPageSlugs) {
    const page = matchingPageBySlug(state.contentRows, slug)
    if (!page || selectName(page, 'Type') !== 'Page' || selectName(page, 'Status') !== 'Draft') {
      throw new Error(`Page ${JSON.stringify(slug)} was not migrated to a Draft Page`)
    }
  }
  const timezoneRows = state.configRows.filter(
    (row) =>
      selectName(row, 'Key') === 'Timezone' &&
      checkboxValue(row, 'Enable') === true &&
      richText(row, 'Value').trim() === 'Asia/Singapore',
  )
  if (timezoneRows.length !== 1) {
    throw new Error('Migrated Config source must have one enabled Asia/Singapore Timezone row')
  }
}

function originalPropertyUpdate(
  page: PageObjectResponse,
  currentSource: DataSourceObjectResponse,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    Type: { select: selectName(page, 'Type') ? { name: selectName(page, 'Type')! } : null },
    Status: {
      select: selectName(page, 'Status') ? { name: selectName(page, 'Status')! } : null,
    },
  }
  if (currentSource.properties.ShowInNavigation) {
    properties.ShowInNavigation = {
      checkbox: checkboxValue(page, 'ShowInNavigation') ?? false,
    }
  }
  if (currentSource.properties.NavigationOrder) {
    properties.NavigationOrder = { number: numberValue(page, 'NavigationOrder') ?? null }
  }
  return properties
}

async function rollback(
  notion: Client,
  environment: NotionEnvironment,
  rollbackPath: string,
): Promise<void> {
  const snapshot = JSON.parse(await readFile(resolve(rollbackPath), 'utf8')) as MigrationSnapshot
  if (snapshot.schemaVersion !== 1 || snapshot.notionApiVersion !== NOTION_API_VERSION) {
    throw new Error('Unsupported Notion migration snapshot')
  }
  const current = await readState(notion, environment)
  const target = verifyTarget(current)
  await captureSnapshot(notion, environment, current, target, 'pre-rollback')

  const originalContentById = new Map(snapshot.contentRows.map((page) => [page.id, page]))
  for (const currentPage of current.contentRows) {
    const original = originalContentById.get(currentPage.id)
    if (!original) continue
    await request(environment, `Restore Content row ${pageTitle(original) || '(untitled)'}`, () =>
      notion.pages.update({
        page_id: currentPage.id,
        properties: originalPropertyUpdate(original, current.contentSource),
      }),
    )
  }

  for (const pageId of snapshot.applied?.createdConfigPageIds ?? []) {
    await request(environment, 'Remove migration-created Config row', () =>
      notion.pages.update({ page_id: pageId, in_trash: true }),
    )
  }

  const originalTypeOptions = propertyOptions(snapshot.contentSource, 'Type')
  const contentProperties: Record<string, unknown> = {
    Type: {
      select: { options: originalTypeOptions.map((option) => ({ id: option.id })) },
    },
  }
  if (!snapshot.contentSource.properties.ShowInNavigation) {
    contentProperties.ShowInNavigation = null
  }
  if (!snapshot.contentSource.properties.NavigationOrder) {
    contentProperties.NavigationOrder = null
  }
  await request(environment, 'Restore Content schema', () =>
    notion.dataSources.update({
      data_source_id: environment.contentDataSourceId,
      properties: contentProperties,
    }),
  )

  const originalKeyOptions = propertyOptions(snapshot.configSource, 'Key')
  await request(environment, 'Restore Config schema', () =>
    notion.dataSources.update({
      data_source_id: environment.configDataSourceId,
      properties: {
        Key: { select: { options: originalKeyOptions.map((option) => ({ id: option.id })) } },
      },
    }),
  )

  const restored = await readState(notion, environment)
  const restoredTypes = propertyOptions(restored.contentSource, 'Type').map((option) => option.name)
  if (
    restoredTypes.includes('Page') &&
    !propertyOptions(snapshot.contentSource, 'Type').some((option) => option.name === 'Page')
  ) {
    throw new Error('Rollback verification found the migration-created Page option')
  }
  console.log('Notion migration rollback completed and verified.')
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2))
  const environment = readNotionEnvironment()
  const notion = createNotionClient(environment.token)

  if (options.rollbackPath) {
    await rollback(notion, environment, options.rollbackPath)
    return
  }

  const initial = await readState(notion, environment)
  const target = verifyTarget(initial)
  const legacyRows = initial.contentRows.filter((row) => selectName(row, 'Type') === 'Content')
  const missingPageOption = !propertyOptions(initial.contentSource, 'Type').some(
    (option) => option.name === 'Page',
  )
  const missingNavigationProperties =
    !initial.contentSource.properties.ShowInNavigation ||
    !initial.contentSource.properties.NavigationOrder
  const missingTimezone =
    !propertyOptions(initial.configSource, 'Key').some((option) => option.name === 'Timezone') ||
    !initial.configRows.some(
      (row) =>
        selectName(row, 'Key') === 'Timezone' &&
        checkboxValue(row, 'Enable') === true &&
        richText(row, 'Value').trim() === 'Asia/Singapore',
    )
  const pagesToDraft = options.draftPageSlugs.filter((slug) => {
    const page = matchingPageBySlug(initial.contentRows, slug)
    return !page || selectName(page, 'Status') !== 'Draft' || selectName(page, 'Type') !== 'Page'
  })
  const changeCount =
    legacyRows.length +
    Number(missingPageOption) +
    Number(missingNavigationProperties) +
    Number(missingTimezone) +
    pagesToDraft.length

  console.log(
    `Notion migration plan: ${legacyRows.length} legacy row(s), ${pagesToDraft.length} Page(s) to draft, ${changeCount} change group(s).`,
  )
  if (!options.apply) {
    console.log('Dry run only. Re-run with --apply after reviewing the plan.')
    return
  }
  if (changeCount === 0) {
    verifyMigratedState(initial, options.draftPageSlugs)
    console.log('Notion sources are already fully migrated.')
    return
  }

  const { snapshot, path } = await captureSnapshot(notion, environment, initial, target)
  console.log(`Private rollback snapshot: ${path}`)

  await ensureContentSchema(notion, environment, initial.contentSource)
  await ensureConfigSchema(notion, environment, initial.configSource)
  const schemaReady = await readState(notion, environment)
  const result = await migrateRows(notion, environment, schemaReady, options.draftPageSlugs)
  const migrated = await readState(notion, environment)
  verifyTarget(migrated)
  verifyMigratedState(migrated, options.draftPageSlugs)

  snapshot.applied = {
    completedAt: new Date().toISOString(),
    draftPageSlugs: options.draftPageSlugs,
    createdConfigPageIds: result.createdConfigPageIds,
    migratedLegacyRows: result.migratedLegacyRows,
  }
  await writeSnapshot(snapshot, path)
  console.log(
    `Notion migration completed: ${result.migratedLegacyRows} legacy row(s) migrated; ${options.draftPageSlugs.length} Page(s) kept Draft.`,
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(redactNotionSecrets(message))
  process.exitCode = 1
})