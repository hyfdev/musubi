import { defineEventHandler } from 'h3'
import { getSite } from '../../site/get-site'
import { contentToPublicPageMeta } from '#shared/site/types'

export default defineEventHandler(async () => {
  const site = await getSite()
  return {
    config: site.config,
    posts: site.posts.map(contentToPublicPageMeta),
  }
})