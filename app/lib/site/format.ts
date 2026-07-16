import type { SiteConfig } from './types.ts'

export type PublishedDateStyle = 'full' | 'month-day'

function parsePublishedDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value)
}

export function formatPublishedDate(
  value: string,
  config: SiteConfig,
  style: PublishedDateStyle = 'full',
): string {
  const date = parsePublishedDate(value)
  const dateOptions: Intl.DateTimeFormatOptions =
    style === 'month-day'
      ? { month: 'short', day: 'numeric', timeZone: config.timezone }
      : { dateStyle: 'medium', timeZone: config.timezone }
  return new Intl.DateTimeFormat(config.lang, dateOptions).format(date)
}

export function formatPublishedYear(value: string, config: SiteConfig): string {
  return new Intl.DateTimeFormat(config.lang, {
    year: 'numeric',
    timeZone: config.timezone,
  }).format(parsePublishedDate(value))
}