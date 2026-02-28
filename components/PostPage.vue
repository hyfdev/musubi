<script setup lang="ts">
import AutoNotionPage from './AutoNotionPage.vue'
import type { PostMeta } from '../server/website/types/PostMeta'
import type { ExtendedRecordMap } from 'notion-types'

const props = defineProps<{
  websiteTitle?: string
  post: {
    meta: PostMeta
    recordMap: ExtendedRecordMap
  }
  notionHtml: string
  serverDarkMode: boolean
}>()

const postMeta = props.post.meta

const date = new Date(postMeta.date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
</script>

<template>
  <article class="max-w-[var(--content-width)] mx-auto py-8">
    <header class="mb-10">
      <time class="text-sm text-[var(--color-text-tertiary)]">{{ date }}</time>
      <div v-if="postMeta.tags.length > 0" class="flex flex-wrap gap-1.5 mt-2">
        <a
          v-for="tag in postMeta.tags"
          :key="tag"
          :href="`/tags/${tag}`"
          class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text)] transition-colors"
        >
          {{ tag }}
        </a>
      </div>
      <h1 class="text-3xl font-bold mt-2 text-[var(--color-text)] tracking-tight leading-tight">
        {{ postMeta.title }}
      </h1>
      <p v-if="postMeta.description" class="text-base text-[var(--color-text-secondary)] mt-3">
        {{ postMeta.description }}
      </p>
    </header>

    <AutoNotionPage
      :record-map="post.recordMap"
      :server-html="notionHtml"
      :server-dark-mode="serverDarkMode"
    />
  </article>
</template>
