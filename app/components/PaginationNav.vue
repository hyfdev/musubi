<script setup lang="ts">
const props = defineProps<{
  page: number
  pageCount: number
}>()

function routeFor(page: number): string {
  return page === 1 ? '/' : `/blog/page/${page}`
}
</script>

<template>
  <nav v-if="pageCount > 1" class="pagination" aria-label="Article index pages">
    <a v-if="page > 1" :href="routeFor(page - 1)" rel="prev">← Previous</a>
    <span v-else aria-hidden="true"></span>
    <span>Page {{ props.page }} of {{ pageCount }}</span>
    <a v-if="page < pageCount" :href="routeFor(page + 1)" rel="next">Next →</a>
    <span v-else aria-hidden="true"></span>
  </nav>
</template>