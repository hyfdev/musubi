const NOTION_ID = /^[a-f\d]{32}$/u

export function canonicalNotionId(value: string, label = 'Notion ID'): string {
  const raw = value.replaceAll('-', '').toLowerCase()
  if (!NOTION_ID.test(raw)) throw new Error(`${label} must be a 32-digit hexadecimal ID`)
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`
}