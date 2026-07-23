import { readFile, rm, rmdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const publicRoot = resolve('dist/client')
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

console.log('Finalized the Void static artifact and removed its build-only client manifest')