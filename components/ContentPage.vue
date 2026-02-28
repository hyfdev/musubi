<script setup lang="ts">
import AutoNotionPage from './AutoNotionPage.vue'
import type { PostMeta } from '../server/website/types/PostMeta'
import type { ExtendedRecordMap } from 'notion-types'

const props = defineProps<{
  websiteTitle?: string
  page: {
    meta: PostMeta
    recordMap: ExtendedRecordMap
  }
  notionHtml: string
  serverDarkMode: boolean
}>()

const pageMeta = props.page.meta
</script>

<template>
  <article class="max-w-[var(--content-width)] mx-auto py-8">
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-[var(--color-text)] tracking-tight leading-tight">
        {{ pageMeta.title }}
      </h1>
    </header>

    <AutoNotionPage
      :record-map="page.recordMap"
      :server-html="notionHtml"
      :server-dark-mode="serverDarkMode"
    />
  </article>
</template>
