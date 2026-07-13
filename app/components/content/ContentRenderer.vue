<script setup lang="ts">
import type { MusubiDocument } from '../../lib/content/types.ts'
import BlockRenderer from './BlockRenderer.vue'

defineProps<{
  document: MusubiDocument
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