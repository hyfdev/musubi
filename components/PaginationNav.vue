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
    class="flex items-center justify-between mt-8 pt-5"
    aria-label="Pagination"
  >
    <a
      v-if="currentPage > 1"
      :href="pageUrl(currentPage - 1)"
      class="text-sm px-4 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-[0_1px_2px_var(--color-shadow)]"
    >
      Previous
    </a>
    <span v-else />
    <span class="text-sm text-[var(--color-text-tertiary)]">
      {{ currentPage }} / {{ totalPages }}
    </span>
    <a
      v-if="currentPage < totalPages"
      :href="pageUrl(currentPage + 1)"
      class="text-sm px-4 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-[0_1px_2px_var(--color-shadow)]"
    >
      Next
    </a>
    <span v-else />
  </nav>
</template>
