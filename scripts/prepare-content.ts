import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

import { extractTextFromAst } from '../app/lib/content/index.ts'
import type { GeneratedPage, GeneratedSiteArtifact } from '../app/lib/site/artifact.ts'
import { resolveSiteConfig } from '../app/lib/site/config.ts'
import { formatPublishedDate } from '../app/lib/site/format.ts'
import { buildRouteManifest } from '../app/lib/site/routes.ts'
import { toPublicPageMeta } from '../app/lib/site/types.ts'
import { stabilizeDocumentAssets } from './lib/assets.ts'
import { buildPublicFonts, type FontBuildManifest } from './lib/build-fonts.ts'
import {
  loadNotionSources,
  loadPublishedNotionPages,
  NOTION_API_VERSION,
  readNotionEnvironment,
  redactNotionSecrets,
} from './lib/notion.ts'

const projectRoot = resolve(import.meta.dirname, '..')
const privateBuildDirectory = resolve(projectRoot, '.musubi')
const generatedPublicDirectory = resolve(projectRoot, 'public/_musubi/generated')
const artifactPath = resolve(privateBuildDirectory, 'site.json')

const applicationText = [
  'Articles',
  'Previous',
  'Next',
  'Page',
  'Table of contents',
  'X post',
  'Read on X',
  'Theme',
  'System',
  'Light',
  'Dark',
  'Page not found',
  'The page you requested does not exist or is not published.',
  'Back to the article index',
  '·',
  '—',
].join('\n')

async function listPublicFiles(directory: string, root = directory): Promise<string[]> {
  const result: string[] = []
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (root === directory && entry.name === '_musubi') {
      continue
    }
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      result.push(...(await listPublicFiles(path, root)))
    } else if (entry.isFile()) {
      result.push(relative(root, path).split(sep).join('/'))
    }
  }
  return result.sort()
}

function publicCorpus(site: Omit<GeneratedSiteArtifact, 'fonts'>): string {
  const configText = Object.values(site.config).join('\n')
  const navigationText = site.navigation.map((item) => item.title).join('\n')
  const pageText = Object.values(site.pages)
    .flatMap((page) => [
      page.meta.title,
      page.meta.description,
      ...page.meta.tags,
      extractTextFromAst(page.document),
    ])
    .join('\n')
  const renderedDates = Object.values(site.pages)
    .flatMap((page) => (page.meta.date ? [formatPublishedDate(page.meta.date, site.config)] : []))
    .join('\n')
  return [applicationText, configText, navigationText, pageText, renderedDates]
    .join('\n')
    .normalize('NFC')
}

async function writeArtifact(artifact: GeneratedSiteArtifact): Promise<string> {
  await mkdir(privateBuildDirectory, { recursive: true })
  const serialized = `${JSON.stringify(artifact, undefined, 2)}\n`
  const temporaryPath = `${artifactPath}.tmp`
  await writeFile(temporaryPath, serialized, { mode: 0o600 })
  await rename(temporaryPath, artifactPath)
  return createHash('sha256').update(serialized).digest('hex')
}

async function writeFontCss(fonts: FontBuildManifest): Promise<void> {
  const luoUnicodeRange = [
    'U+00B7',
    'U+2014',
    'U+2018-2019',
    'U+201C-201D',
    'U+2026',
    'U+2E3A-2E3B',
    'U+3000-303F',
    'U+3400-4DBF',
    'U+4E00-9FFF',
    'U+F900-FAFF',
    'U+FE30-FE4F',
    'U+FF01-FF60',
    'U+FFE0-FFE6',
  ].join(', ')
  const fallback = fonts.artifacts.fallback
    ? `\n@font-face {\n  font-family: 'Musubi CJK Fallback';\n  src: url('/_musubi/generated/${fonts.artifacts.fallback.path}') format('woff2');\n  font-display: swap;\n  font-style: normal;\n  font-weight: 400;\n  unicode-range: ${fonts.resolvedCoverage.fallback.cssUnicodeRange};\n}\n`
    : ''
  const css = `@font-face {\n  font-family: 'Luo';\n  src: url('/_musubi/generated/${fonts.artifacts.luo.path}') format('woff2');\n  font-display: swap;\n  font-style: normal;\n  font-weight: 400;\n  unicode-range: ${luoUnicodeRange};\n}\n${fallback}`
  await writeFile(resolve(generatedPublicDirectory, 'fonts/fonts.css'), css)
}

async function main(): Promise<void> {
  await rm(privateBuildDirectory, { recursive: true, force: true })
  await rm(generatedPublicDirectory, { recursive: true, force: true })
  await mkdir(generatedPublicDirectory, { recursive: true })

  const environment = readNotionEnvironment()
  const sources = await loadNotionSources(environment)
  const config = resolveSiteConfig(sources.config)
  const publicFiles = await listPublicFiles(resolve(projectRoot, 'public'))
  const routeManifest = buildRouteManifest(
    sources.content.map(({ row }) => row),
    config.postsPerPage,
    publicFiles,
  )
  const loadedPages = await loadPublishedNotionPages(environment, sources.content)
  const stabilized = await stabilizeDocumentAssets(
    loadedPages.map(({ document }) => document),
    generatedPublicDirectory,
  )

  const metadataBySource = new Map(
    [...routeManifest.posts, ...routeManifest.contentPages].map((page) => [page.sourceLabel, page]),
  )
  const pages: Record<string, GeneratedPage> = {}
  for (const [index, loaded] of loadedPages.entries()) {
    const metadata = metadataBySource.get(loaded.row.sourceLabel)
    if (!metadata) {
      throw new Error(
        `${loaded.row.sourceLabel}: parsed page is absent from the validated route manifest`,
      )
    }
    pages[metadata.route] = {
      meta: toPublicPageMeta(metadata),
      document: stabilized.documents[index]!,
    }
  }

  const siteWithoutFonts: Omit<GeneratedSiteArtifact, 'fonts'> = {
    schemaVersion: 1,
    config,
    navigation: routeManifest.navigation,
    postIndexPages: routeManifest.postIndexPages,
    pages,
    routes: routeManifest.routes,
    generation: {
      contentRows: sources.content.length,
      publishedPages: loadedPages.length,
      configRows: sources.config.length,
      stabilizedAssets: stabilized.files.length,
      notionApiVersion: NOTION_API_VERSION,
    },
  }
  const fonts = await buildPublicFonts(publicCorpus(siteWithoutFonts), generatedPublicDirectory)
  await writeFontCss(fonts)
  const artifact: GeneratedSiteArtifact = { ...siteWithoutFonts, fonts }
  const checksum = await writeArtifact(artifact)

  const bytes = (await readFile(artifactPath)).byteLength
  console.log(
    `Prepared ${artifact.generation.publishedPages} Published pages across ${artifact.routes.length} routes (${bytes} private bytes, SHA-256 ${checksum.slice(0, 12)}…)`,
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(redactNotionSecrets(message))
  process.exitCode = 1
})