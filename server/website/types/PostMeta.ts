export interface PostMeta {
  pageId: string
  title: string
  slug: string // URL segment (e.g., my-post)
  date: string // ISO date string (YYYY-MM-DD)
  description: string // SEO description
  tags: string[] // Tags/categories
}
