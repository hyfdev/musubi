import { defineEventHandler } from 'h3'
import { getSite } from '../../site/get-site'

export default defineEventHandler(async () => {
  const site = await getSite()
  return {
    config: site.config,
    navigation: site.navigation,
  }
})