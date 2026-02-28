import { defineHandler, defineHead } from 'void'
import type { SharedData } from '../../../server/website/getSharedData'
import { getSharedData } from '../../../server/website/getSharedData'
import { resolveWebsiteConfig } from '../../../server/website/resolveWebsiteConfig'
import { Website } from '../../../server/website/Website'
import { POSTS_PER_PAGE } from '../../../utils/pagination'

export interface Props {
  shared: SharedData
  websiteTitle?: string
  posts: Array<{
    title: string
    slug: string
    date: string
    description: string
    tags: string[]
  }>
  currentPage: number
  totalPages: number
}

export const head = defineHead<Props>((c, props) => ({
  title: `Posts - Page ${props.currentPage}`,
}))

export async function getPrerenderPaths() {
  const [website, config] = await Promise.all([Website.getInstance(), resolveWebsiteConfig()])
  const postsPerPage = parseInt(config.postsPerPage ?? '', 10) || POSTS_PER_PAGE
  const posts = await website.getPostMetaList()
  const totalPages = Math.ceil(posts.length / postsPerPage)
  return Array.from({ length: totalPages }, (_, i) => ({ page: String(i + 1) }))
}

export const loader = defineHandler<Props>(async (c) => {
  const page = Number(c.req.param('page'))
  if (!Number.isInteger(page) || page < 1) {
    return c.notFound()
  }

  const [shared, website, config] = await Promise.all([
    getSharedData(),
    Website.getInstance(),
    resolveWebsiteConfig(),
  ])

  const postsPerPage = parseInt(config.postsPerPage ?? '', 10) || POSTS_PER_PAGE
  const postMetaList = await website.getPostMetaList()
  const allPosts = postMetaList.map((post) => ({
    title: post.title,
    slug: post.slug,
    date: post.date,
    description: post.description,
    tags: post.tags,
  }))

  const totalPages = Math.ceil(allPosts.length / postsPerPage)
  if (page > totalPages) {
    return c.notFound()
  }

  const start = (page - 1) * postsPerPage
  return {
    shared,
    websiteTitle: shared.websiteTitle,
    posts: allPosts.slice(start, start + postsPerPage),
    currentPage: page,
    totalPages,
  }
})
