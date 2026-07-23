export const WRANGLER_CONFIG_FILENAME = 'wrangler.json'
export const WRANGLER_DEPLOY_CONFIG_PATH = '.wrangler/deploy/config.json'

export const WRANGLER_CONFIG = {
  name: 'musubi',
  compatibility_date: '2026-07-18',
  assets: {
    directory: './client',
    not_found_handling: '404-page',
    html_handling: 'drop-trailing-slash',
  },
}

export const WRANGLER_DEPLOY_CONFIG = {
  configPath: '../../dist/wrangler.json',
}

export function renderWranglerConfig() {
  return `${JSON.stringify(WRANGLER_CONFIG, null, 2)}\n`
}

export function renderWranglerDeployConfig() {
  return `${JSON.stringify(WRANGLER_DEPLOY_CONFIG, null, 2)}\n`
}