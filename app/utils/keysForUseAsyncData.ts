// Layout keys
export const NAVBAR_DATA_KEY = 'navbar-data'
export const FOOTER_DATA_KEY = 'footer-data'

// Page keys
export const HOME_PAGE_DATA_KEY = 'home-page-data'
export const createBlogPageDataKey = (page: number) => `blog-page-${page}`
export const createPostPageDataKey = (slug: string) => `post-page-${slug}`
export const createContentPageDataKey = (slug: string) => `content-page-${slug}`

// Tag page keys
export const TAGS_PAGE_DATA_KEY = 'tags-page-data'
export const createTagPageDataKey = (tag: string, page: number) => `tag-page-${tag}-${page}`

// Notion page key
export const createNotionPageKey = (pageId: string) => `notion-page-${pageId}`
