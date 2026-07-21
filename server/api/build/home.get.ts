import { defineEventHandler } from 'h3'
import { getSite } from '../../site/get-site'
import { contentToPublicPageMeta } from '#shared/site/types'

export default defineEventHandler(async () => {
  const site = await getSite()
  return {
    config: site.config,
    // `pageLabel` is the snapshot's absolute build path. Nothing renders it, and this response is
    // inlined into the prerendered document, so it must not cross the API boundary.
    home: site.home ? { document: { ...site.home.document, pageLabel: '' } } : null,
    posts: site.posts.slice(0, 5).map(contentToPublicPageMeta),
    hasMorePosts: site.posts.length > 5,
  }
})