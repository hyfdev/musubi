<script setup lang="ts">
import { onMounted } from 'vue'
import type { MusubiXEmbed } from '../../lib/content/types.ts'
import TypographyText from '../TypographyText.vue'
import InlineRenderer from './InlineRenderer.vue'

defineProps<{
  block: MusubiXEmbed
}>()

onMounted(() => {
  document.dispatchEvent(new Event('musubi:x-embed-mounted'))
})
</script>

<template>
  <figure v-if="block.embed" class="x-embed">
    <div class="x-embed-widget" aria-hidden="true"></div>
    <blockquote
      class="x-embed-fallback"
      :cite="block.url"
      :lang="block.embed.lang ?? undefined"
      :dir="block.embed.dir ?? undefined"
    >
      <header class="x-embed-fallback-header">
        <a
          class="x-embed-author"
          :href="block.embed.authorUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <TypographyText :value="block.embed.authorName" />
          <span class="x-embed-handle">@{{ block.embed.authorHandle }}</span>
        </a>
        <span class="x-embed-mark" aria-hidden="true">X</span>
      </header>
      <p class="x-embed-text">
        <InlineRenderer :nodes="block.embed.content" />
      </p>
      <footer class="x-embed-fallback-footer" lang="en">
        <a :href="block.url" target="_blank" rel="noopener noreferrer">
          {{ block.embed.publishedLabel }} · View on X
        </a>
      </footer>
    </blockquote>
  </figure>

  <aside v-else class="x-link-card" lang="en">
    <span class="x-link-card-mark" aria-hidden="true">X</span>
    <div>
      <p class="x-link-card-label">Referenced X post</p>
      <a :href="block.url" target="_blank" rel="noopener noreferrer">Read the post on X</a>
    </div>
  </aside>
</template>