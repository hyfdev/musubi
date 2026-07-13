import { createError, defineEventHandler, getQuery } from 'h3'
import { getPreparedSite } from '../../utils/prepared-site'

export default defineEventHandler(async (event) => {
  const route = getQuery(event).route
  if (typeof route !== 'string' || !route.startsWith('/')) {
    throw createError({ statusCode: 400, statusMessage: 'A page route is required' })
  }

  const site = await getPreparedSite()
  const page = site.pages[route]
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
  return {
    config: site.config,
    page,
  }
})