import { readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const publicRoot = resolve('.output/public')
const sourceDirectory = resolve(publicRoot, '__musubi_not_found')
const sourcePath = resolve(sourceDirectory, 'index.html')
const targetPath = resolve(publicRoot, '404.html')

const document = await readFile(sourcePath, 'utf8').catch(() => undefined)
if (!document?.includes('Page not found') || !document.includes('href="/"')) {
  throw new Error("Nuxt did not generate Musubi's visible static 404 source page")
}

await writeFile(targetPath, document)
await rm(sourceDirectory, { recursive: true, force: true })
await rm(resolve(publicRoot, '200.html'), { force: true })

console.log('Finalized the visible static 404 document and removed the unused 200 fallback')