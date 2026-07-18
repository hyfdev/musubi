<script setup lang="ts">
import type { MusubiXEmbed } from '#shared/content/types'

defineProps<{
  block: MusubiXEmbed
}>()
</script>

<template>
  <aside class="x-link-card" lang="en">
    <span class="x-link-card-mark" aria-hidden="true">X</span>
    <div>
      <p class="x-link-card-label">Referenced X post</p>
      <a :href="block.url" target="_blank" rel="noopener noreferrer">Read the post on X</a>
    </div>
  </aside>
</template>