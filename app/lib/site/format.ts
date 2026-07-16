import type { SiteConfig } from './types.ts'

export type PublishedDateStyle = 'full' | 'month-day'

function parsePublishedDate(value: string, timezone: string): { date: Date; timezone: string } {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  return {
    date: new Date(dateOnly ? `${value}T00:00:00Z` : value),
    timezone: dateOnly ? 'UTC' : timezone,
  }
}

export function formatPublishedDate(
  value: string,
  config: SiteConfig,
  style: PublishedDateStyle = 'full',
): string {
  const { date, timezone } = parsePublishedDate(value, config.timezone)
  const dateOptions: Intl.DateTimeFormatOptions =
    style === 'month-day'
      ? { month: 'short', day: 'numeric', timeZone: timezone }
      : { dateStyle: 'medium', timeZone: timezone }
  return new Intl.DateTimeFormat(config.lang, dateOptions).format(date)
}

export function formatPublishedYear(value: string, config: SiteConfig): string {
  const { date, timezone } = parsePublishedDate(value, config.timezone)
  return new Intl.DateTimeFormat(config.lang, {
    year: 'numeric',
    timeZone: timezone,
  }).format(date)
}