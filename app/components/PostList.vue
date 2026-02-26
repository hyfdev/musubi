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
  <div v-if="posts.length > 0" class="flex flex-col">
    <a
      v-for="post in posts"
      :key="post.slug"
      :href="`/blog/${post.slug}`"
      class="group flex flex-col gap-1 py-3 -mx-3 px-3 rounded-md no-underline hover:bg-[var(--color-bg-subtle)] transition-colors"
    >
      <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <span
          class="text-base font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent)]"
        >
          {{ post.title }}
        </span>
        <time class="text-sm text-[var(--color-text-tertiary)] tabular-nums whitespace-nowrap">
          {{ formatDate(post.date) }}
        </time>
      </div>
      <p
        v-if="post.description"
        class="text-sm text-[var(--color-text-secondary)] line-clamp-2 m-0"
      >
        {{ post.description }}
      </p>
      <div v-if="post.tags.length > 0" class="flex flex-wrap gap-1.5 mt-1">
        <a
          v-for="tag in post.tags"
          :key="tag"
          :href="`/tags/${tag}`"
          class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text)] transition-colors"
          @click.stop
        >
          {{ tag }}
        </a>
      </div>
    </a>
  </div>
  <p v-else class="py-8 text-center text-[var(--color-text-secondary)]">No posts found.</p>
</template>
