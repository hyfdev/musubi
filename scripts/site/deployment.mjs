export const WRANGLER_CONFIG_FILENAME = 'wrangler.json'

export const WRANGLER_CONFIG = {
  name: 'hyf-me',
  compatibility_date: '2026-07-18',
  assets: {
    directory: './dist/client',
    not_found_handling: '404-page',
    html_handling: 'drop-trailing-slash',
  },
}

export function renderWranglerConfig() {
  return `${JSON.stringify(WRANGLER_CONFIG, null, 2)}\n`
}