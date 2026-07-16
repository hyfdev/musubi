<script setup lang="ts">
import type { GeneratedPage } from '../lib/site/artifact.ts'
import { formatPublishedDate } from '../lib/site/format.ts'
import type { SiteConfig } from '../lib/site/types.ts'
import TypographyText from './TypographyText.vue'
import ContentRenderer from './content/ContentRenderer.vue'

defineProps<{
  page: GeneratedPage
  config: SiteConfig
}>()
</script>

<template>
  <article class="article-page">
    <header class="article-header shell">
      <div class="article-title-block reading-column">
        <h1><TypographyText :value="page.meta.title" /></h1>
        <p v-if="page.meta.description" class="article-lede">
          <TypographyText :value="page.meta.description" />
        </p>
        <p v-if="page.meta.date" class="article-meta">
          <time :datetime="page.meta.date">{{ formatPublishedDate(page.meta.date, config) }}</time>
        </p>
      </div>
      <div class="page-divider" aria-hidden="true"></div>
    </header>
    <div class="article-column reading-column">
      <ContentRenderer :document="page.document" />
      <nav class="article-end" aria-label="Article navigation" lang="en">
        <a href="/blog">Back to Blog</a>
      </nav>
    </div>
  </article>
</template>