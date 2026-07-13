import type { SiteConfig } from './types.ts'

export function formatPublishedDate(value: string, config: SiteConfig): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value)
  return new Intl.DateTimeFormat(config.lang, {
    dateStyle: 'medium',
    timeZone: config.timezone,
  }).format(date)
}