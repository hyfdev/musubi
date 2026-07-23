import { defineHandler, defineHead } from 'void'
import { getSite } from '../../server/site/get-site.ts'
import { toPublicHome } from '../../shared/site/public.ts'
import type { HomePageProps } from '../../shared/site/public.ts'
import { contentToPublicPageMeta } from '../../shared/site/types.ts'

export const loader = defineHandler<HomePageProps>(async () => {
  const site = await getSite()
  return {
    config: site.config,
    home: site.home ? toPublicHome(site.home) : null,
    posts: site.posts.slice(0, 5).map(contentToPublicPageMeta),
    hasMorePosts: site.posts.length > 5,
  }
})

export const head = defineHead<HomePageProps>((_c, page) => ({
  title: page.config.title,
  link: [{ rel: 'canonical', href: page.config.link }],
  meta: [
    { property: 'og:title', content: page.config.title },
    { property: 'og:description', content: page.config.description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: page.config.link },
  ],
}))