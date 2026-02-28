import { defineHandler, defineHead } from 'void'
import type { SharedData } from '../../server/website/getSharedData'
import { getSharedData } from '../../server/website/getSharedData'
import { Website } from '../../server/website/Website'

export interface Props {
  shared: SharedData
  websiteTitle?: string
  tags: Array<{ name: string; count: number }>
}

export const head = defineHead<Props>(() => ({
  title: 'Tags',
}))

export const loader = defineHandler<Props>(async () => {
  const [shared, website] = await Promise.all([getSharedData(), Website.getInstance()])

  const postMetaList = await website.getPostMetaList()
  const tagCounts = new Map<string, number>()
  for (const post of postMetaList) {
    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
    }
  }
  const tags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    shared,
    websiteTitle: shared.websiteTitle,
    tags,
  }
})
