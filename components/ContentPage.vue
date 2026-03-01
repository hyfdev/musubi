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
  <article class="max-w-[var(--content-width)] mx-auto py-10">
    <header class="mb-12">
      <h1
        class="text-[2rem] sm:text-[2.25rem] font-[var(--font-display)] font-bold text-[var(--color-text)] tracking-[-0.02em] leading-[1.2]"
      >
        {{ pageMeta.title }}
      </h1>
      <div class="mt-6 h-px bg-[var(--color-border)]" />
    </header>

    <AutoNotionPage
      :record-map="page.recordMap"
      :server-html="notionHtml"
      :server-dark-mode="serverDarkMode"
    />
  </article>
</template>
