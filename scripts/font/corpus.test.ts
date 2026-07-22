import { describe, expect, it } from 'vite-plus/test'
import { classifyChineseTypographyText } from '../../shared/chinese-typography.ts'
import {
  extractFontCorporaFromAst,
  extractInlineTypographyContext,
} from '../../shared/content/corpus.ts'
import type { MusubiDocument } from '../../shared/content/types.ts'
import type { Home, Site } from '../../shared/site/types.ts'
import { createPublicFontCorpora } from './corpus.ts'

const homeDocument: MusubiDocument = {
  type: 'document',
  pageLabel: 'Home',
  children: [
    {
      type: 'paragraph',
      children: [
        { type: 'text', value: '首页专属内容' },
        { type: 'inlineCode', value: 'const 首页 = true' },
      ],
    },
  ],
  tableOfContents: [],
}

const home: Home = {
  sourceLabel: 'Home',
  title: '首页元数据',
  slug: '',
  route: '/',
  type: 'Home',
  description: '首页描述',
  tags: ['首页标签'],
  document: homeDocument,
}

const site: Site = {
  config: {
    title: '中文站名',
    description: 'Site description',
    author: 'Author',
    link: 'https://example.com',
    lang: 'zh-CN',
    timezone: 'Asia/Singapore',
    github: 'example',
    x: 'example',
  },
  posts: [],
  pages: [],
  home,
  navigation: [{ title: '中文导航', route: '/page' }],
  byRoute: new Map([['/', home]]),
  routes: ['/'],
}

describe('public font corpus', () => {
  it('covers Home, site identity, navigation, metadata, prose, and code', () => {
    const corpus = createPublicFontCorpora(site)
    expect(corpus.text).toContain('中文站名')
    expect(corpus.text).toContain('中文导航')
    expect(corpus.text).toContain('首页元数据')
    expect(corpus.text).toContain('首页描述')
    expect(corpus.text).toContain('首页标签')
    expect(corpus.text).toContain('首页专属内容')
    expect(corpus.code).toContain('const 首页 = true')
    expect(corpus.text).toContain('© 0123456789')
    expect(corpus.text).toContain('#')
    expect(corpus.text).toContain('…')
  })

  it('keeps one punctuation context across inline markup and stops at visual breaks', () => {
    const children: MusubiDocument['children'][number] & { type: 'paragraph' } = {
      type: 'paragraph',
      children: [
        { type: 'text', value: '“' },
        { type: 'strong', children: [{ type: 'text', value: '中文' }] },
        { type: 'text', value: '”' },
        { type: 'break' },
        { type: 'text', value: '“English”' },
      ],
    }
    const document: MusubiDocument = {
      type: 'document',
      pageLabel: 'Inline context',
      children: [children],
      tableOfContents: [],
    }

    expect(extractInlineTypographyContext(children.children)).toBe('“中文”\n“English”')
    const corpus = extractFontCorporaFromAst(document)
    expect(corpus.text).toBe('“中文”\n“English”')
    expect(
      classifyChineseTypographyText(corpus.text)
        .filter((entry) => entry.cjk)
        .map((entry) => entry.character)
        .join(''),
    ).toBe('“中文”')
  })

  it('assigns code-block language labels to the JetBrains Mono corpus', () => {
    const document: MusubiDocument = {
      type: 'document',
      pageLabel: 'Code language',
      children: [{ type: 'code', language: 'typescript', value: 'x' }],
      tableOfContents: [],
    }

    expect(extractFontCorporaFromAst(document)).toEqual({ text: '', code: 'typescript\nx' })
  })
})