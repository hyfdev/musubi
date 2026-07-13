<script setup lang="ts">
import type { GeneratedPage } from '../lib/site/artifact.ts'
import { formatPublishedDate } from '../lib/site/format.ts'
import type { SiteConfig } from '../lib/site/types.ts'
import ContentRenderer from './content/ContentRenderer.vue'

defineProps<{
  page: GeneratedPage
  config: SiteConfig
}>()
</script>

<template>
  <article class="article-page">
    <header class="article-header shell">
      <div class="article-title-block">
        <p class="section-label"><span aria-hidden="true"></span>Article</p>
        <h1>{{ page.meta.title }}</h1>
        <p v-if="page.meta.description" class="article-lede">{{ page.meta.description }}</p>
      </div>
      <div class="article-meta">
        <time v-if="page.meta.date" :datetime="page.meta.date">{{
          formatPublishedDate(page.meta.date, config)
        }}</time>
        <p v-if="page.meta.tags.length">{{ page.meta.tags.join(' · ') }}</p>
      </div>
    </header>
    <div class="article-column">
      <ContentRenderer :document="page.document" />
    </div>
  </article>
</template>