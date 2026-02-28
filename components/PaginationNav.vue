<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
  firstPageUrl: string
  pageBaseUrl: string
}>()

function pageUrl(page: number): string {
  if (page === 1) return props.firstPageUrl
  return `${props.pageBaseUrl}/${page}`
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-between mt-8 pt-4 border-t border-[var(--color-border)]"
    aria-label="Pagination"
  >
    <a
      v-if="currentPage > 1"
      :href="pageUrl(currentPage - 1)"
      class="text-sm px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text)] transition-colors"
    >
      Previous
    </a>
    <span v-else />
    <span class="text-sm text-[var(--color-text-tertiary)]">
      Page {{ currentPage }} of {{ totalPages }}
    </span>
    <a
      v-if="currentPage < totalPages"
      :href="pageUrl(currentPage + 1)"
      class="text-sm px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text)] transition-colors"
    >
      Next
    </a>
    <span v-else />
  </nav>
</template>
