import { defineHandler, defineHead } from 'void'
import type { SharedData } from '../server/website/getSharedData'
import type { PostMeta } from '../server/website/types/PostMeta'
import type { ExtendedRecordMap } from 'notion-types'
import { getSharedData } from '../server/website/getSharedData'
import { Website } from '../server/website/Website'
import { renderNotionHtml } from '../server/website/renderNotionHtml'

export interface Props {
  shared: SharedData
  websiteTitle?: string
  page: {
    meta: PostMeta
    recordMap: ExtendedRecordMap
  }
  notionHtml: string
  serverDarkMode: boolean
}

export const head = defineHead<Props>((c, props) => ({
  title: props.page.meta.title,
  meta: [
    ...(props.page.meta.description
      ? [{ name: 'description', content: props.page.meta.description }]
      : []),
    { property: 'og:title', content: props.page.meta.title },
    ...(props.page.meta.description
      ? [{ property: 'og:description', content: props.page.meta.description }]
      : []),
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: props.page.meta.title },
    ...(props.page.meta.description
      ? [{ name: 'twitter:description', content: props.page.meta.description }]
      : []),
  ],
}))

export async function getPrerenderPaths() {
  const website = await Website.getInstance()
  const contentPages = await website.getContentPages()
  return contentPages.map((page) => ({ slug: page.slug }))
}

export const loader = defineHandler<Props>(async (c) => {
  const slug = c.req.param('slug')

  const [shared, website] = await Promise.all([getSharedData(), Website.getInstance()])

  let page
  try {
    page = await website.getContentPageBySlug(slug)
  } catch {
    return c.notFound()
  }
  const notionHtml = renderNotionHtml(page.recordMap, false)

  return {
    shared,
    websiteTitle: shared.websiteTitle,
    page,
    notionHtml,
    serverDarkMode: false,
  }
})
