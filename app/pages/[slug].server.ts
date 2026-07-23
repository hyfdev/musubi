import { HTTPException } from 'hono/http-exception'
import { defineHandler, defineHead } from 'void'
import { getSite } from '../../server/site/get-site.ts'
import { toPublicStandalonePage } from '../../shared/site/public.ts'
import type { StandalonePageProps } from '../../shared/site/public.ts'

export async function getPrerenderPaths() {
  const site = await getSite()
  return site.pages.map((page) => ({ slug: page.slug }))
}

export const loader = defineHandler<StandalonePageProps>(async (c) => {
  const site = await getSite()
  const page = site.byRoute.get(`/${c.req.param('slug')}`)
  if (page?.type !== 'Page') {
    throw new HTTPException(404, { message: 'Page not found' })
  }
  return {
    config: site.config,
    page: toPublicStandalonePage(page),
  }
})

export const head = defineHead<StandalonePageProps>((_c, response) => {
  const { config, page } = response
  const canonical = new URL(page.route, config.link).toString()
  const description = page.description || config.description
  return {
    title: `${page.title} — ${config.title}`,
    link: [{ rel: 'canonical', href: canonical }],
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: page.title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: canonical },
    ],
  }
})