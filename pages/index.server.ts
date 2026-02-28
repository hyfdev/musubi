import { defineHandler, defineHead } from 'void'
import type { SharedData } from '../server/website/getSharedData'
import { getSharedData } from '../server/website/getSharedData'
import { resolveWebsiteConfig } from '../server/website/resolveWebsiteConfig'
import { Website } from '../server/website/Website'
import { POSTS_PER_PAGE } from '../utils/pagination'

export interface Props {
  shared: SharedData
  websiteTitle?: string
  websiteDescription?: string
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

export const head = defineHead<Props>(() => ({
  title: 'Home',
}))

export const loader = defineHandler<Props>(async () => {
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

  return {
    shared,
    websiteTitle: shared.websiteTitle,
    websiteDescription: shared.websiteDescription,
    posts: allPosts.slice(0, postsPerPage),
    currentPage: 1,
    totalPages: Math.ceil(allPosts.length / postsPerPage),
  }
})
