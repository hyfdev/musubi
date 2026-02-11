import { usePrerenderData } from 'nuxt-prerender-kit/runtime'
import { HOME_PAGE_DATA_KEY } from '~/utils/keysForUseAsyncData'

export async function useHomePageData() {
  return await usePrerenderData(HOME_PAGE_DATA_KEY, async () => {
    const { Website } = await import('~~/app/server/website/Website')
    const { resolveWebsiteConfig } = await import('~~/app/server/website/resolveWebsiteConfig')
    const website = await Website.getInstance()
    const [postMetaList, config] = await Promise.all([
      website.getPostMetaList(),
      resolveWebsiteConfig(),
    ])
    return {
      websiteTitle: config.title,
      posts: postMetaList.map((post) => ({
        title: post.title,
        slug: post.slug,
        date: post.date,
      })),
    }
  })
}
