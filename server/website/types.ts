import type { ExtendedRecordMap } from 'notion-types'
import type { PostMeta } from './types/PostMeta'

export interface Post {
  meta: PostMeta
  recordMap: ExtendedRecordMap
}
