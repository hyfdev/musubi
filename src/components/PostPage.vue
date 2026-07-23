<script setup lang="ts">
import { formatPublishedDate } from '#shared/site/format'
import type { PublicPost } from '#shared/site/public'
import type { SiteConfig } from '#shared/site/types'
import TypographyText from './TypographyText.vue'
import ContentRenderer from './content/ContentRenderer.vue'

defineProps<{
  page: PublicPost
  config: SiteConfig
}>()
</script>

<template>
  <article class="article-page">
    <header class="article-header shell">
      <div class="article-title-block reading-column">
        <h1><TypographyText :value="page.title" /></h1>
        <p v-if="page.description" class="article-lede">
          <TypographyText :value="page.description" />
        </p>
        <p class="article-meta">
          <time :datetime="page.date">{{ formatPublishedDate(page.date, config) }}</time>
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