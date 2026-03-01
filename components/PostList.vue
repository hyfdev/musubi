<script setup lang="ts">
defineProps<{
  posts: Array<{
    title: string
    slug: string
    date: string
    description: string
    tags: string[]
  }>
}>()

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div v-if="posts.length > 0" class="flex flex-col gap-3">
    <a
      v-for="post in posts"
      :key="post.slug"
      :href="`/blog/${post.slug}`"
      class="group block p-4 sm:p-5 rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)] no-underline shadow-[0_1px_3px_var(--color-shadow)] hover:shadow-[0_3px_12px_var(--color-shadow-hover)] hover:border-[var(--color-accent)] transition-all duration-200"
    >
      <div class="flex flex-col gap-1.5">
        <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <span
            class="text-base font-[var(--font-display)] font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors"
          >
            {{ post.title }}
          </span>
          <time
            class="text-[13px] text-[var(--color-text-tertiary)] tabular-nums whitespace-nowrap"
          >
            {{ formatDate(post.date) }}
          </time>
        </div>
        <p
          v-if="post.description"
          class="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 m-0"
        >
          {{ post.description }}
        </p>
        <div v-if="post.tags.length > 0" class="flex flex-wrap gap-1.5 mt-1">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="text-xs px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </a>
  </div>
  <p v-else class="py-12 text-center text-[var(--color-text-secondary)]">No posts found.</p>
</template>
