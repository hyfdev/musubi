import { defineHandler, defineHead } from 'void'
import type { SharedData } from '../../../server/website/getSharedData'
import { getSharedData } from '../../../server/website/getSharedData'
import { resolveWebsiteConfig } from '../../../server/website/resolveWebsiteConfig'
import { Website } from '../../../server/website/Website'
import { POSTS_PER_PAGE } from '../../../utils/pagination'

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
  title: `Posts tagged "${props.tag}"`,
}))

export async function getPrerenderPaths() {
  const website = await Website.getInstance()
  const posts = await website.getPostMetaList()
  const tags = new Set<string>()
  for (const post of posts) {
    for (const tag of post.tags) tags.add(tag)
  }
  return Array.from(tags).map((tag) => ({ tag }))
}

export const loader = defineHandler<Props>(async (c) => {
  const tag = c.req.param('tag')

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

  return {
    shared,
    websiteTitle: shared.websiteTitle,
    tag,
    totalPosts: allPosts.length,
    posts: allPosts.slice(0, postsPerPage),
    currentPage: 1,
    totalPages,
  }
})
