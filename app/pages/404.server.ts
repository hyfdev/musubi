import { defineHandler, defineHead } from 'void'
import { getSite } from '../../server/site/get-site.ts'

export interface NotFoundPageProps {
  title: string
}

export const loader = defineHandler<NotFoundPageProps>(async () => {
  const site = await getSite()
  return {
    title: `Page not found — ${site.config.title}`,
  }
})

export const head = defineHead<NotFoundPageProps>((_c, page) => ({
  title: page.title,
  meta: [{ name: 'robots', content: 'noindex' }],
}))