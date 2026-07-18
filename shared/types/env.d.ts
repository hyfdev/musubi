declare namespace NodeJS {
  interface ProcessEnv {
    NOTION_TOKEN?: string
    NOTION_DB_PAGE_ID?: string
    NOTION_CONFIG_PAGE_ID?: string
  }
}