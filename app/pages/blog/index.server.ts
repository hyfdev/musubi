import { defineHandler, defineHead } from 'void'
import { getSite } from '../../../server/site/get-site.ts'
import type { BlogPageProps } from '../../../shared/site/public.ts'
import { contentToPublicPageMeta } from '../../../shared/site/types.ts'

export const loader = defineHandler<BlogPageProps>(async () => {
  const site = await getSite()
  return {
    config: site.config,
    posts: site.posts.map(contentToPublicPageMeta),
  }
})

export const head = defineHead<BlogPageProps>((_c, page) => {
  const canonical = new URL('/blog', page.config.link).toString()
  return {
    title: `Blog — ${page.config.title}`,
    link: [{ rel: 'canonical', href: canonical }],
    meta: [
      { property: 'og:title', content: `Blog — ${page.config.title}` },
      { property: 'og:description', content: page.config.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonical },
    ],
  }
})