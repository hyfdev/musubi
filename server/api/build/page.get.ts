import { createError, defineEventHandler, getQuery } from 'h3'
import { getSite } from '../../site/get-site'

export default defineEventHandler(async (event) => {
  const route = getQuery(event).route
  if (typeof route !== 'string' || !route.startsWith('/')) {
    throw createError({ statusCode: 400, statusMessage: 'A page route is required' })
  }

  const site = await getSite()
  const page = site.byRoute.get(route)
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
  return {
    config: site.config,
    page,
  }
})