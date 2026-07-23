import { HTTPException } from 'hono/http-exception'
import { defineHandler, defineHead } from 'void'
import { getSite } from '../../server/site/get-site.ts'
import { toPublicPost } from '../../shared/site/public.ts'
import type { PostPageProps } from '../../shared/site/public.ts'

export async function getPrerenderPaths() {
  const site = await getSite()
  return site.posts.map((post) => ({ slug: post.slug }))
}

export const loader = defineHandler<PostPageProps>(async (c) => {
  const site = await getSite()
  const page = site.byRoute.get(`/blog/${c.req.param('slug')}`)
  if (page?.type !== 'Post') {
    throw new HTTPException(404, { message: 'Article not found' })
  }
  return {
    config: site.config,
    page: toPublicPost(page),
  }
})

export const head = defineHead<PostPageProps>((_c, response) => {
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
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: canonical },
    ],
  }
})