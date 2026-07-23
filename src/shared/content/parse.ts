import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { MusubiContentError } from './errors.ts'
import { normalizeMusubiMarkdown, type EmbedUrlsByBlockId } from './normalize.ts'
import { preprocessNotionMarkdown, restoreCalloutTextBracesInSyntaxTree } from './preprocess.ts'
import type { MarkdownSyntaxNode } from './syntax.ts'
import type { MusubiDocument } from './types.ts'

export interface ParseMusubiMarkdownOptions {
  readonly pageLabel: string
  readonly embedUrlsByBlockId?: EmbedUrlsByBlockId
}

export function parseMusubiMarkdown(
  markdown: string,
  options: ParseMusubiMarkdownOptions,
): MusubiDocument {
  try {
    const preparedMarkdown = preprocessNotionMarkdown(markdown, options.pageLabel)
    const syntaxTree = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMdx)
      .parse(preparedMarkdown) as MarkdownSyntaxNode

    return normalizeMusubiMarkdown(restoreCalloutTextBracesInSyntaxTree(syntaxTree), options)
  } catch (error) {
    if (error instanceof MusubiContentError) throw error
    throw new MusubiContentError({
      code: 'MARKDOWN_PARSE_ERROR',
      pageLabel: options.pageLabel,
      message: error instanceof Error ? error.message : 'Markdown parsing failed',
      cause: error,
    })
  }
}