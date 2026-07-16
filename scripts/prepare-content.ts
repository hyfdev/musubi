import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

import { extractTypographyCorpora } from '../app/lib/content/index.ts'
import type { GeneratedPage, GeneratedSiteArtifact } from '../app/lib/site/artifact.ts'
import { resolveSiteConfig } from '../app/lib/site/config.ts'
import { formatPublishedDate } from '../app/lib/site/format.ts'
import { buildRouteManifest } from '../app/lib/site/routes.ts'
import { toPublicPageMeta } from '../app/lib/site/types.ts'
import { stabilizeDocumentAssets } from './lib/assets.ts'
import { buildPublicFonts, type FontBuildManifest, type FontCorpora } from './lib/build-fonts.ts'
import { highlightDocuments } from './lib/highlight.ts'
import {
  loadNotionSources,
  loadPublishedNotionPages,
  NOTION_API_VERSION,
  readNotionEnvironment,
  redactNotionSecrets,
} from './lib/notion.ts'
import { enrichXEmbeds } from './lib/x-embeds.ts'

const projectRoot = resolve(import.meta.dirname, '..')
const privateBuildDirectory = resolve(projectRoot, '.musubi')
const generatedPublicDirectory = resolve(projectRoot, 'public/_musubi/generated')
const artifactPath = resolve(privateBuildDirectory, 'site.json')

const applicationText = [
  'Home',
  'Blog',
  'Table of contents',
  'Referenced X post',
  'Read the post on X',
  'View on X',
  'Theme',
  'System',
  'Light',
  'Dark',
  'Copy',
  'Copied',
  'Copy failed',
  'Back to Blog',
  'Note',
  'Warning',
  'Error',
  'Page not found',
  'The page you requested does not exist or is not published.',
  'Back to Home',
  'No posts have been published yet.',
  'Built with Musubi',
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

function publicCorpora(site: Omit<GeneratedSiteArtifact, 'fonts'>): FontCorpora {
  const configText = Object.values(site.config).join('\n')
  const navigationText = site.navigation.map((item) => item.title).join('\n')
  const typography = Object.values(site.pages).map((page) =>
    extractTypographyCorpora(page.document),
  )
  const metadataText = Object.values(site.pages)
    .flatMap((page) => [page.meta.title, page.meta.description, ...page.meta.tags])
    .join('\n')
  const titleText = Object.values(site.pages)
    .map((page) => page.meta.title)
    .join('\n')
  const renderedDates = Object.values(site.pages)
    .flatMap((page) => (page.meta.date ? [formatPublishedDate(page.meta.date, site.config)] : []))
    .join('\n')
  return {
    body: [
      applicationText,
      configText,
      navigationText,
      metadataText,
      renderedDates,
      ...typography.map((corpus) => corpus.body),
    ]
      .join('\n')
      .normalize('NFC'),
    emphasis: [titleText, ...typography.map((corpus) => corpus.emphasis)]
      .join('\n')
      .normalize('NFC'),
  }
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
  const tsangerFace = (
    family: string,
    weight: number,
    artifact: FontBuildManifest['artifacts']['tsangerW04'],
  ): string | null => {
    if (!artifact) return null
    return `@font-face {\n  font-family: '${family}';\n  src: url('/_musubi/generated/${artifact.path}') format('woff2');\n  font-display: swap;\n  font-style: normal;\n  font-weight: ${weight};\n  unicode-range: ${artifact.coverage.cssUnicodeRange};\n}`
  }
  const faces = [
    tsangerFace('Tsanger JinKai W04', 400, fonts.artifacts.tsangerW04),
    tsangerFace('Tsanger JinKai W05', 500, fonts.artifacts.tsangerW05),
    ...fonts.artifacts.fallbackShards.map(
      (artifact) =>
        `@font-face {\n  font-family: 'Musubi CJK Fallback';\n  src: url('/_musubi/generated/${artifact.path}') format('woff2');\n  font-display: swap;\n  font-style: normal;\n  font-weight: 400 500;\n  unicode-range: ${artifact.coverage.cssUnicodeRange};\n}`,
    ),
  ].filter((face): face is string => face !== null)
  const css = `${faces.join('\n\n')}\n`
  await writeFile(resolve(generatedPublicDirectory, 'fonts/fonts.css'), css)
}

async function main(): Promise<void> {
  await rm(artifactPath, { force: true })
  await rm(`${artifactPath}.tmp`, { force: true })
  await rm(generatedPublicDirectory, { recursive: true, force: true })
  await mkdir(generatedPublicDirectory, { recursive: true })

  const environment = readNotionEnvironment()
  const sources = await loadNotionSources(environment)
  const config = resolveSiteConfig(sources.config)
  const publicFiles = await listPublicFiles(resolve(projectRoot, 'public'))
  const routeManifest = buildRouteManifest(
    sources.content.map(({ row }) => row),
    publicFiles,
  )
  const loadedPages = await loadPublishedNotionPages(environment, sources.content)
  const xEmbeds = await enrichXEmbeds(loadedPages.map(({ document }) => document))
  for (const failure of xEmbeds.failures) {
    console.warn(
      `X embed ${failure.url} could not be enriched; keeping the safe link fallback (${failure.message})`,
    )
  }
  const stabilized = await stabilizeDocumentAssets(xEmbeds.documents, generatedPublicDirectory)
  const highlightedDocuments = await highlightDocuments(stabilized.documents)

  const metadataBySource = new Map(
    [...routeManifest.posts, ...routeManifest.standalonePages].map((page) => [
      page.sourceLabel,
      page,
    ]),
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
      document: highlightedDocuments[index]!,
    }
  }

  const siteWithoutFonts: Omit<GeneratedSiteArtifact, 'fonts'> = {
    schemaVersion: 2,
    config,
    navigation: routeManifest.navigation,
    homePosts: routeManifest.homePosts,
    blogPosts: routeManifest.blogPosts,
    pages,
    routes: routeManifest.routes,
    generation: {
      contentRows: sources.content.length,
      publishedPages: loadedPages.length,
      configRows: sources.config.length,
      stabilizedAssets: stabilized.files.length,
      xEmbeds: {
        total: xEmbeds.total,
        enriched: xEmbeds.enriched,
        fallback: xEmbeds.fallback,
      },
      notionApiVersion: NOTION_API_VERSION,
    },
  }
  const fonts = await buildPublicFonts(publicCorpora(siteWithoutFonts), generatedPublicDirectory)
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