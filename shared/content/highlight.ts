import {
  bundledLanguages,
  bundledLanguagesInfo,
  codeToTokensWithThemes,
  type BundledLanguage,
} from 'shiki'

import type {
  MusubiBlock,
  MusubiCodeBlock,
  MusubiCodeHighlight,
  MusubiCodeToken,
  MusubiDocument,
} from './types.ts'

const GITHUB_LIGHT_FOREGROUND = '#24292E'
const GITHUB_DARK_FOREGROUND = '#E1E4E8'

type MutableCodeToken = {
  -readonly [Key in keyof MusubiCodeToken]: MusubiCodeToken[Key]
}

const PLAIN_TEXT_LANGUAGES = new Set(['text', 'plaintext', 'txt', 'plain', 'plain text'])
const LANGUAGE_BY_DISPLAY_NAME = new Map<string, BundledLanguage>(
  bundledLanguagesInfo.map((language) => [
    language.name.toLowerCase(),
    language.id as BundledLanguage,
  ]),
)
const NOTION_LANGUAGE_ALIASES = new Map<string, BundledLanguage | 'text'>([
  ['arduino', 'cpp'],
  ['basic', 'vb'],
  ['flow', 'javascript'],
  ['fortran', 'fortran-free-form'],
  ['markup', 'html'],
  ['mathematica', 'wolfram'],
  ['vb.net', 'vb'],
  ['java/c/c++/c#', 'text'],
])

function resolveLanguage(language: string | null): BundledLanguage | 'text' {
  const normalized = language?.trim().toLowerCase() ?? 'text'
  if (PLAIN_TEXT_LANGUAGES.has(normalized)) {
    return 'text'
  }
  const notionAlias = NOTION_LANGUAGE_ALIASES.get(normalized)
  if (notionAlias) {
    return notionAlias
  }
  if (Object.hasOwn(bundledLanguages, normalized)) {
    return normalized as BundledLanguage
  }
  return LANGUAGE_BY_DISPLAY_NAME.get(normalized) ?? 'text'
}

function appendToken(
  tokens: MutableCodeToken[],
  content: string,
  light: string,
  dark: string,
  lightStyle: number,
  darkStyle: number,
): void {
  if (!content) {
    return
  }
  const previous = tokens.at(-1)
  if (
    previous?.light === light &&
    previous.dark === dark &&
    previous.lightStyle === lightStyle &&
    previous.darkStyle === darkStyle
  ) {
    previous.content += content
  } else {
    tokens.push({ content, light, dark, lightStyle, darkStyle })
  }
}

function lineSeparators(source: string, lineCount: number): string[] {
  const lfSeparators = Array.from(source.matchAll(/\r\n|\n/g), (match) => match[0])
  if (lfSeparators.length === lineCount - 1) {
    return lfSeparators
  }

  const allSeparators = Array.from(source.matchAll(/\r\n|\r|\n/g), (match) => match[0])
  if (allSeparators.length === lineCount - 1) {
    return allSeparators
  }

  throw new Error('Shiki returned a line count that cannot preserve the source line endings')
}

async function highlightCode(block: MusubiCodeBlock): Promise<MusubiCodeHighlight> {
  const languageId = resolveLanguage(block.language)
  const lines = await codeToTokensWithThemes(block.value, {
    lang: languageId,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
  })
  const tokens: MutableCodeToken[] = []
  const separators = lineSeparators(block.value, lines.length)
  for (const [lineIndex, line] of lines.entries()) {
    for (const token of line) {
      appendToken(
        tokens,
        token.content,
        token.variants.light?.color ?? GITHUB_LIGHT_FOREGROUND,
        token.variants.dark?.color ?? GITHUB_DARK_FOREGROUND,
        Math.max(0, token.variants.light?.fontStyle ?? 0),
        Math.max(0, token.variants.dark?.fontStyle ?? 0),
      )
    }
    if (lineIndex < lines.length - 1) {
      appendToken(
        tokens,
        separators[lineIndex]!,
        GITHUB_LIGHT_FOREGROUND,
        GITHUB_DARK_FOREGROUND,
        0,
        0,
      )
    }
  }
  return { languageId, tokens }
}

async function highlightBlock(block: MusubiBlock): Promise<MusubiBlock> {
  switch (block.type) {
    case 'code':
      return { ...block, highlight: await highlightCode(block) }
    case 'list':
      return {
        ...block,
        children: await Promise.all(
          block.children.map(async (item) => ({
            ...item,
            children: await highlightBlocks(item.children),
          })),
        ),
      }
    case 'quote':
    case 'callout':
      return { ...block, children: await highlightBlocks(block.children) }
    default:
      return block
  }
}

async function highlightBlocks(blocks: readonly MusubiBlock[]): Promise<MusubiBlock[]> {
  return Promise.all(blocks.map(highlightBlock))
}

export async function highlightDocuments(
  documents: readonly MusubiDocument[],
): Promise<MusubiDocument[]> {
  return Promise.all(
    documents.map(async (document) => ({
      ...document,
      children: await highlightBlocks(document.children),
    })),
  )
}