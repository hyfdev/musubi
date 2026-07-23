import { describe, expect, it } from 'vite-plus/test'
import type { Home, Page, Post } from './types.ts'
import { toPublicHome, toPublicPost, toPublicStandalonePage } from './public.ts'

const document = {
  type: 'document' as const,
  pageLabel: '/private/build/.musubi/notion-data-snapshot/pages/example.json',
  children: [],
  tableOfContents: [],
}

describe('public site data', () => {
  it('does not serialize snapshot paths or internal source labels', () => {
    const post: Post = {
      sourceLabel: '/private/build/.musubi/notion-data-snapshot/pages/post.json',
      title: 'Post',
      slug: 'post',
      route: '/blog/post',
      type: 'Post',
      date: '2026-07-23',
      description: '',
      tags: [],
      document,
    }
    const page: Page = {
      sourceLabel: '/private/build/.musubi/notion-data-snapshot/pages/page.json',
      title: 'Page',
      slug: 'page',
      route: '/page',
      type: 'Page',
      description: '',
      tags: [],
      showInNavigation: true,
      document,
    }
    const home: Home = {
      sourceLabel: '/private/build/.musubi/notion-data-snapshot/pages/home.json',
      title: 'Home',
      slug: '',
      route: '/',
      type: 'Home',
      description: '',
      tags: [],
      document,
    }

    const serialized = JSON.stringify({
      post: toPublicPost(post),
      page: toPublicStandalonePage(page),
      home: toPublicHome(home),
    })

    expect(serialized).not.toContain('sourceLabel')
    expect(serialized).not.toContain('pageLabel')
    expect(serialized).not.toContain('notion-data-snapshot')
    expect(serialized).not.toContain('/private/build')
  })
})