import { extractFontCorporaFromAst } from '../../shared/content/corpus.ts'
import { formatPublishedDate } from '../../shared/site/format.ts'
import type { Site } from '../../shared/site/types.ts'
import type { FontCorpora } from './build-fonts.ts'

const applicationText = [
  'Skip to content',
  'Home',
  'Blog',
  'Recent',
  'Contents',
  'Table of contents',
  'Referenced X post',
  'Read the post on X',
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
  'Something went wrong',
  'This page could not be rendered.',
  'Back to Home',
  'No posts have been published yet.',
  'Built with Musubi',
  '© 0123456789',
  '#',
  '…',
  '↓',
  '•',
  '·',
  '—',
].join('\n')

export function createPublicFontCorpora(site: Site): FontCorpora {
  const contents = [...(site.home ? [site.home] : []), ...site.posts, ...site.pages]
  const documents = contents.map((page) => extractFontCorporaFromAst(page.document))
  const configText = Object.values(site.config).join('\n')
  const navigationText = site.navigation.map((item) => item.title).join('\n')
  const metadataText = contents
    .flatMap((page) => [page.title, page.description, ...page.tags])
    .join('\n')
  const renderedDates = site.posts
    .map((page) => formatPublishedDate(page.date, site.config))
    .join('\n')
  return {
    text: [
      applicationText,
      configText,
      navigationText,
      metadataText,
      renderedDates,
      ...documents.map((corpus) => corpus.text),
    ]
      .join('\n')
      .normalize('NFC'),
    code: documents
      .map((corpus) => corpus.code)
      .join('\n')
      .normalize('NFC'),
  }
}