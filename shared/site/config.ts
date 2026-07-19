import type { SiteConfig, SourceConfigRow } from './types.ts'

export const defaultSiteConfig: SiteConfig = {
  title: 'Musubi',
  description: 'A personal website published from Notion.',
  author: 'Musubi',
  link: 'https://example.com/',
  lang: 'en-SG',
  timezone: 'Asia/Singapore',
  github: '',
  x: '',
}

const configKeys = {
  'Site Title': 'title',
  'Site Description': 'description',
  Author: 'author',
  Link: 'link',
  Lang: 'lang',
  Timezone: 'timezone',
  GitHub: 'github',
  'X(Twitter)': 'x',
} as const

const configKeyAliases = {
  Title: 'Site Title',
  Description: 'Site Description',
} as const

type ConfigKey = keyof typeof configKeys
type ConfigKeyAlias = keyof typeof configKeyAliases
type LegacyConfigKey = 'Since' | 'PostsPerPage'

const legacyConfigKeys = new Set<LegacyConfigKey>(['Since', 'PostsPerPage'])

function parseNonempty(value: string, row: SourceConfigRow): string {
  const normalized = value.trim()
  if (!normalized) {
    throw new Error(`${row.sourceLabel}: ${row.key} must be a nonempty string`)
  }
  return normalized
}

function parseUrl(value: string, row: SourceConfigRow): string {
  const normalized = parseNonempty(value, row)
  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    throw new Error(`${row.sourceLabel}: ${row.key} must be an absolute HTTP(S) URL`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${row.sourceLabel}: ${row.key} must use HTTP or HTTPS`)
  }
  return url.toString()
}

function parseLanguage(value: string, row: SourceConfigRow): string {
  const normalized = parseNonempty(value, row)
  try {
    const [language] = Intl.getCanonicalLocales(normalized)
    if (!language) {
      throw new Error('missing canonical language')
    }
    return language
  } catch {
    throw new Error(`${row.sourceLabel}: Lang must be a valid BCP 47 language tag`)
  }
}

function parseTimezone(value: string, row: SourceConfigRow): string {
  const normalized = parseNonempty(value, row)
  try {
    return new Intl.DateTimeFormat('en', { timeZone: normalized }).resolvedOptions().timeZone
  } catch {
    throw new Error(`${row.sourceLabel}: Timezone must be a valid IANA time-zone identifier`)
  }
}

function parseInteger(value: string, row: SourceConfigRow, kind: 'year' | 'positive'): number {
  const normalized = parseNonempty(value, row)
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${row.sourceLabel}: ${row.key} must be a base-10 integer`)
  }
  const number = Number(normalized)
  const valid =
    Number.isSafeInteger(number) && (kind === 'year' ? number >= 1 && number <= 9999 : number > 0)
  if (!valid) {
    const range = kind === 'year' ? 'from 1 through 9999' : 'greater than zero'
    throw new Error(`${row.sourceLabel}: ${row.key} must be ${range}`)
  }
  return number
}

function parseConfigValue(
  key: ConfigKey,
  row: SourceConfigRow,
): SiteConfig[(typeof configKeys)[ConfigKey]] {
  switch (key) {
    case 'Site Title':
    case 'Site Description':
    case 'Author':
      return parseNonempty(row.value, row)
    case 'Link':
    case 'GitHub':
    case 'X(Twitter)':
      return parseUrl(row.value, row)
    case 'Lang':
      return parseLanguage(row.value, row)
    case 'Timezone':
      return parseTimezone(row.value, row)
  }
}

function isConfigKey(key: string): key is ConfigKey {
  return Object.hasOwn(configKeys, key)
}

function isConfigKeyAlias(key: string): key is ConfigKeyAlias {
  return Object.hasOwn(configKeyAliases, key)
}

function isLegacyConfigKey(key: string): key is LegacyConfigKey {
  return legacyConfigKeys.has(key as LegacyConfigKey)
}

export function resolveSiteConfig(rows: SourceConfigRow[]): SiteConfig {
  const resolved: SiteConfig = { ...defaultSiteConfig }
  const seen = new Map<ConfigKey | LegacyConfigKey, SourceConfigRow>()

  for (const row of rows) {
    if (!row.enabled) {
      continue
    }
    if (!isConfigKey(row.key) && !isConfigKeyAlias(row.key) && !isLegacyConfigKey(row.key)) {
      throw new Error(`${row.sourceLabel}: unknown enabled Config key ${JSON.stringify(row.key)}`)
    }
    const key = isConfigKeyAlias(row.key) ? configKeyAliases[row.key] : row.key
    const previous = seen.get(key)
    if (previous) {
      throw new Error(
        `${row.sourceLabel} conflicts with ${previous.sourceLabel}: duplicate enabled Config key ${key}`,
      )
    }
    seen.set(key, row)

    // Existing snapshots may still contain these removed settings. Validate their old value so
    // malformed data does not become silently acceptable, then ignore them because neither has
    // current site behavior.
    if (key === 'Since') {
      parseInteger(row.value, row, 'year')
      continue
    }
    if (key === 'PostsPerPage') {
      parseInteger(row.value, row, 'positive')
      continue
    }

    const field = configKeys[key]
    const value = parseConfigValue(key, row)
    Object.assign(resolved, { [field]: value })
  }

  return resolved
}