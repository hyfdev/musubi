import { usePrerenderData } from 'nuxt-prerender-kit/runtime'
import { NAVBAR_DATA_KEY } from '~/utils/keysForUseAsyncData'

export async function useNavbarData() {
  return await usePrerenderData(NAVBAR_DATA_KEY, async () => {
    const { Website } = await import('~~/app/server/website/Website')
    const { resolveWebsiteConfig } = await import('~~/app/server/website/resolveWebsiteConfig')
    const website = await Website.getInstance()
    const [contentPages, config] = await Promise.all([
      website.getContentPages(),
      resolveWebsiteConfig(),
    ])
    return {
      contentPages: contentPages.map((page) => ({
        title: page.title,
        slug: page.slug,
      })),
      social: config.social,
    }
  })
}
