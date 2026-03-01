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
  <article class="max-w-[var(--content-width)] mx-auto py-10">
    <header class="mb-12">
      <div class="flex items-center gap-3 text-[13px] text-[var(--color-text-tertiary)]">
        <time>{{ date }}</time>
        <template v-if="postMeta.tags.length > 0">
          <span class="text-[var(--color-border)]">/</span>
          <div class="flex flex-wrap gap-1.5">
            <a
              v-for="tag in postMeta.tags"
              :key="tag"
              :href="`/tags/${tag}`"
              class="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium no-underline hover:bg-[var(--color-accent)] hover:text-white transition-colors text-xs"
            >
              {{ tag }}
            </a>
          </div>
        </template>
      </div>
      <h1
        class="text-[2rem] sm:text-[2.25rem] font-[var(--font-display)] font-bold mt-4 text-[var(--color-text)] tracking-[-0.02em] leading-[1.2]"
      >
        {{ postMeta.title }}
      </h1>
      <p
        v-if="postMeta.description"
        class="text-base text-[var(--color-text-secondary)] mt-3 leading-relaxed"
      >
        {{ postMeta.description }}
      </p>
      <div class="mt-6 h-px bg-[var(--color-border)]" />
    </header>

    <AutoNotionPage
      :record-map="post.recordMap"
      :server-html="notionHtml"
      :server-dark-mode="serverDarkMode"
    />
  </article>
</template>
