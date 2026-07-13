<script setup lang="ts">
import type { MusubiTableOfContentsEntry } from '../../lib/content/types.ts'

defineProps<{
  entries: readonly MusubiTableOfContentsEntry[]
}>()
</script>

<template>
  <ol class="content-toc-list">
    <li v-for="entry in entries" :key="entry.id">
      <a :href="`#${entry.id}`">{{ entry.label }}</a>
      <TocList v-if="entry.children.length" :entries="entry.children" />
    </li>
  </ol>
</template>