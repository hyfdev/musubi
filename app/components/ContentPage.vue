<script setup lang="ts">
import type { GeneratedPage } from '../lib/site/artifact.ts'
import ContentRenderer from './content/ContentRenderer.vue'

defineProps<{
  page: GeneratedPage
}>()
</script>

<template>
  <article class="article-page standalone-page">
    <header class="article-header shell">
      <div class="article-title-block">
        <p class="section-label"><span aria-hidden="true"></span>Page</p>
        <h1>{{ page.meta.title }}</h1>
        <p v-if="page.meta.description" class="article-lede">{{ page.meta.description }}</p>
      </div>
    </header>
    <div class="article-column">
      <ContentRenderer :document="page.document" />
    </div>
  </article>
</template>