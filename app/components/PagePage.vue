<script setup lang="ts">
import type { GeneratedPage } from '../lib/site/artifact.ts'
import TypographyText from './TypographyText.vue'
import ContentRenderer from './content/ContentRenderer.vue'

defineProps<{
  page: GeneratedPage
}>()
</script>

<template>
  <article class="article-page standalone-page">
    <header class="article-header shell">
      <div class="article-title-block reading-column">
        <h1><TypographyText :value="page.meta.title" /></h1>
        <p v-if="page.meta.description" class="article-lede">
          <TypographyText :value="page.meta.description" />
        </p>
      </div>
      <div class="page-divider" aria-hidden="true"></div>
    </header>
    <div class="article-column reading-column">
      <ContentRenderer :document="page.document" />
    </div>
  </article>
</template>