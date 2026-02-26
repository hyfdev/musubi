import { useRoute, createError } from '#imports'
import { usePrerenderData } from 'nuxt-prerender-kit/runtime'
import { createTagPageDataKey } from '~/utils/keysForUseAsyncData'

export async function useTagPageData() {
  const route = useRoute()
  const tag = route.params.tag

  if (typeof tag !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: `Expected 'tag' to be a string, but got ${typeof tag}`,
      fatal: true,
    })
  }

  return await usePrerenderData(createTagPageDataKey(tag), async () => {
    const { Website } = await import('~~/app/server/website/Website')
    const { resolveWebsiteConfig } = await import('~~/app/server/website/resolveWebsiteConfig')
    const website = await Website.getInstance()
    const [postMetaList, config] = await Promise.all([
      website.getPostMetaList(),
      resolveWebsiteConfig(),
    ])
    const posts = postMetaList
      .filter((post) => post.tags.includes(tag))
      .map((post) => ({
        title: post.title,
        slug: post.slug,
        date: post.date,
        description: post.description,
        tags: post.tags,
      }))
    return {
      websiteTitle: config.title,
      tag,
      posts,
    }
  })
}
