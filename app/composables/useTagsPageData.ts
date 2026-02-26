import { usePrerenderData } from 'nuxt-prerender-kit/runtime'
import { TAGS_PAGE_DATA_KEY } from '~/utils/keysForUseAsyncData'

export async function useTagsPageData() {
  return await usePrerenderData(TAGS_PAGE_DATA_KEY, async () => {
    const { Website } = await import('~~/app/server/website/Website')
    const { resolveWebsiteConfig } = await import('~~/app/server/website/resolveWebsiteConfig')
    const website = await Website.getInstance()
    const [postMetaList, config] = await Promise.all([
      website.getPostMetaList(),
      resolveWebsiteConfig(),
    ])
    const tagCounts = new Map<string, number>()
    for (const post of postMetaList) {
      for (const tag of post.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      }
    }
    const tags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return {
      websiteTitle: config.title,
      tags,
    }
  })
}
