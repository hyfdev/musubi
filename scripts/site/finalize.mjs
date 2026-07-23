import { mkdir, readFile, rm, rmdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import {
  renderWranglerConfig,
  renderWranglerDeployConfig,
  WRANGLER_CONFIG_FILENAME,
  WRANGLER_DEPLOY_CONFIG_PATH,
} from './deployment.mjs'

const distRoot = resolve('dist')
const publicRoot = resolve(distRoot, 'client')
const notFoundPath = resolve(publicRoot, '404.html')
const notFoundDocument = await readFile(notFoundPath, 'utf8').catch(() => undefined)

if (!notFoundDocument?.includes('Page not found') || !notFoundDocument.includes('href="/"')) {
  throw new Error("Void did not generate Musubi's visible static 404 page")
}

const viteDirectory = resolve(publicRoot, '.vite')
await rm(resolve(viteDirectory, 'manifest.json'), { force: true })
await rmdir(viteDirectory).catch((error) => {
  if (!['ENOENT', 'ENOTEMPTY'].includes(error.code)) throw error
})

const deployConfigPath = resolve(WRANGLER_DEPLOY_CONFIG_PATH)
await mkdir(dirname(deployConfigPath), { recursive: true })
await writeFile(resolve(distRoot, WRANGLER_CONFIG_FILENAME), renderWranglerConfig(), 'utf8')
await writeFile(deployConfigPath, renderWranglerDeployConfig(), 'utf8')

console.log('Finalized the static output and generated its Wrangler deployment configuration')