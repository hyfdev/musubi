declare namespace NodeJS {
  interface ProcessEnv {
    NOTION_TOKEN?: string
    NOTION_CONTENT_DATA_SOURCE_ID?: string
    NOTION_CONFIG_DATA_SOURCE_ID?: string
  }
}