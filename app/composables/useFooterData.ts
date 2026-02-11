import { usePrerenderData } from 'nuxt-prerender-kit/runtime'
import { FOOTER_DATA_KEY } from '~/utils/keysForUseAsyncData'

export async function useFooterData() {
  return await usePrerenderData(FOOTER_DATA_KEY, async () => {
    const { resolveWebsiteConfig } = await import('~~/app/server/website/resolveWebsiteConfig')
    const config = await resolveWebsiteConfig()
    return {
      author: config.author,
    }
  })
}
