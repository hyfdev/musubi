<script setup lang="ts">
import type { PublicStandalonePage } from '#shared/site/public'
import TypographyText from './TypographyText.vue'
import ContentRenderer from './content/ContentRenderer.vue'

defineProps<{
  page: PublicStandalonePage
}>()
</script>

<template>
  <article class="article-page standalone-page">
    <header class="article-header shell">
      <div class="article-title-block reading-column">
        <h1><TypographyText :value="page.title" /></h1>
        <p v-if="page.description" class="article-lede">
          <TypographyText :value="page.description" />
        </p>
      </div>
      <div class="page-divider" aria-hidden="true"></div>
    </header>
    <div class="article-column reading-column">
      <ContentRenderer :document="page.document" />
    </div>
  </article>
</template>