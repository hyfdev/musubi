import { defineEventHandler } from 'h3'
import { getPreparedSite } from '../../utils/prepared-site'

export default defineEventHandler(async () => {
  const site = await getPreparedSite()
  return {
    config: site.config,
    posts: site.blogPosts,
  }
})