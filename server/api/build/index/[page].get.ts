import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getPreparedSite } from '../../../utils/prepared-site'

export default defineEventHandler(async (event) => {
  const rawPage = getRouterParam(event, 'page')
  const page = Number(rawPage)
  if (!Number.isSafeInteger(page) || page < 1 || String(page) !== rawPage) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid index page' })
  }

  const site = await getPreparedSite()
  const index = site.postIndexPages.find((candidate) => candidate.page === page)
  if (!index) {
    throw createError({ statusCode: 404, statusMessage: 'Index page not found' })
  }
  return {
    config: site.config,
    index,
    pageCount: site.postIndexPages.length,
  }
})