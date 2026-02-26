import { useRoute, createError } from '#imports'
import { usePrerenderData } from 'nuxt-prerender-kit/runtime'
import { createBlogPageDataKey } from '~/utils/keysForUseAsyncData'

export async function useBlogPageData() {
  const route = useRoute()
  const page = Number(route.params.page)

  if (!Number.isInteger(page) || page < 2) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page not found',
      fatal: true,
    })
  }

  return await usePrerenderData(createBlogPageDataKey(page), async () => {
    const { Website } = await import('~~/app/server/website/Website')
    const { resolveWebsiteConfig } = await import('~~/app/server/website/resolveWebsiteConfig')
    const { POSTS_PER_PAGE } = await import('~~/app/utils/pagination')
    const website = await Website.getInstance()
    const [postMetaList, config] = await Promise.all([
      website.getPostMetaList(),
      resolveWebsiteConfig(),
    ])
    const allPosts = postMetaList.map((post) => ({
      title: post.title,
      slug: post.slug,
      date: post.date,
      description: post.description,
      tags: post.tags,
    }))
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
    if (page > totalPages) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Page not found',
        fatal: true,
      })
    }
    const start = (page - 1) * POSTS_PER_PAGE
    return {
      websiteTitle: config.title,
      posts: allPosts.slice(start, start + POSTS_PER_PAGE),
      currentPage: page,
      totalPages,
    }
  })
}
