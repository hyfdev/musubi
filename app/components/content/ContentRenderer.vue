<script setup lang="ts">
import type { PublicDocument } from '#shared/site/public'
import BlockRenderer from './BlockRenderer.vue'

defineProps<{
  document: PublicDocument
}>()
</script>

<template>
  <div class="prose-content">
    <BlockRenderer
      v-for="(block, index) in document.children"
      :key="index"
      :block="block"
      :table-of-contents="document.tableOfContents"
    />
  </div>
</template>