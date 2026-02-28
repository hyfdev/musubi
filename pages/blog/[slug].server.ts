import { defineHandler, defineHead } from 'void'
import type { SharedData } from '../../server/website/getSharedData'
import type { PostMeta } from '../../server/website/types/PostMeta'
import type { ExtendedRecordMap } from 'notion-types'
import { getSharedData } from '../../server/website/getSharedData'
import { Website } from '../../server/website/Website'
import { renderNotionHtml } from '../../server/website/renderNotionHtml'

export interface Props {
  shared: SharedData
  websiteTitle?: string
  post: {
    meta: PostMeta
    recordMap: ExtendedRecordMap
  }
  notionHtml: string
  serverDarkMode: boolean
}

export const head = defineHead<Props>((c, props) => ({
  title: props.post.meta.title,
  meta: [
    ...(props.post.meta.description
      ? [{ name: 'description', content: props.post.meta.description }]
      : []),
    { property: 'og:title', content: props.post.meta.title },
    ...(props.post.meta.description
      ? [{ property: 'og:description', content: props.post.meta.description }]
      : []),
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: props.post.meta.title },
    ...(props.post.meta.description
      ? [{ name: 'twitter:description', content: props.post.meta.description }]
      : []),
  ],
}))

export async function getPrerenderPaths() {
  const website = await Website.getInstance()
  const posts = await website.getPostMetaList()
  return posts.map((post) => ({ slug: post.slug }))
}

export const loader = defineHandler<Props>(async (c) => {
  const slug = c.req.param('slug')

  const [shared, website] = await Promise.all([getSharedData(), Website.getInstance()])

  const post = await website.getPostBySlug(slug)
  const notionHtml = renderNotionHtml(post.recordMap, false)

  return {
    shared,
    websiteTitle: shared.websiteTitle,
    post,
    notionHtml,
    serverDarkMode: false,
  }
})
