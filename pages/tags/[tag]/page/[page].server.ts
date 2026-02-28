import { defineHandler, defineHead } from 'void'
import type { SharedData } from '../../../../server/website/getSharedData'
import { getSharedData } from '../../../../server/website/getSharedData'
import { resolveWebsiteConfig } from '../../../../server/website/resolveWebsiteConfig'
import { Website } from '../../../../server/website/Website'
import { POSTS_PER_PAGE } from '../../../../utils/pagination'

export interface Props {
  shared: SharedData
  websiteTitle?: string
  tag: string
  totalPosts: number
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
  title: `Posts tagged "${props.tag}" - Page ${props.currentPage}`,
}))

export async function getPrerenderPaths() {
  const [website, config] = await Promise.all([Website.getInstance(), resolveWebsiteConfig()])
  const postsPerPage = parseInt(config.postsPerPage ?? '', 10) || POSTS_PER_PAGE
  const posts = await website.getPostMetaList()
  const tagCounts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }
  const paths: Array<{ tag: string; page: string }> = []
  for (const [tag, count] of tagCounts) {
    const totalPages = Math.ceil(count / postsPerPage)
    for (let page = 1; page <= totalPages; page++) {
      paths.push({ tag, page: String(page) })
    }
  }
  return paths
}

export const loader = defineHandler<Props>(async (c) => {
  const tag = c.req.param('tag')
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
  const allPosts = postMetaList
    .filter((post) => post.tags.includes(tag))
    .map((post) => ({
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
    tag,
    totalPosts: allPosts.length,
    posts: allPosts.slice(start, start + postsPerPage),
    currentPage: page,
    totalPages,
  }
})
