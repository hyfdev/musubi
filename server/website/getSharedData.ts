import { Website } from './Website'
import { resolveWebsiteConfig } from './resolveWebsiteConfig'

export interface SharedData {
  contentPages: Array<{ title: string; slug: string }>
  socialLink?: { github?: string; x?: string }
  author?: string
  websiteTitle?: string
  websiteDescription?: string
  lang?: string
  siteUrl?: string
  since?: string
}

export async function getSharedData(): Promise<SharedData> {
  const [website, config] = await Promise.all([Website.getInstance(), resolveWebsiteConfig()])
  const contentPages = await website.getContentPages()
  return {
    contentPages: contentPages.map((p) => ({ title: p.title, slug: p.slug })),
    socialLink: config.socialLink,
    author: config.author,
    websiteTitle: config.title,
    websiteDescription: config.description,
    lang: config.lang,
    siteUrl: config.link,
    since: config.since,
  }
}
