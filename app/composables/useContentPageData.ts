import { useRoute, createError } from '#imports'
import { usePrerenderData } from 'nuxt-prerender-kit/runtime'
import { createContentPageDataKey } from '~/utils/keysForUseAsyncData'

export async function useContentPageData() {
  const route = useRoute()
  const slug = route.params.slug

  if (typeof slug !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: `Expected 'slug' to be a string, but got ${typeof slug}`,
      fatal: true,
    })
  }

  return await usePrerenderData(createContentPageDataKey(slug), async () => {
    const { Website } = await import('~~/app/server/website/Website')
    const { resolveWebsiteConfig } = await import('~~/app/server/website/resolveWebsiteConfig')
    const website = await Website.getInstance()
    const [page, config] = await Promise.all([
      website.getContentPageBySlug(slug),
      resolveWebsiteConfig(),
    ])
    return {
      websiteTitle: config.title,
      page,
    }
  })
}
