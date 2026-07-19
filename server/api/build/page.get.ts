import { createError, defineEventHandler, getQuery } from 'h3'
import { getSite } from '../../site/get-site'

export default defineEventHandler(async (event) => {
  const route = getQuery(event).route
  if (typeof route !== 'string' || !route.startsWith('/')) {
    throw createError({ status: 400, statusText: 'A page route is required' })
  }

  const site = await getSite()
  const page = site.byRoute.get(route)
  if (!page) {
    throw createError({ status: 404, statusText: 'Page not found' })
  }
  return {
    config: site.config,
    page,
  }
})