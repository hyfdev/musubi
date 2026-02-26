<script setup lang="ts">
import { ref, computed } from 'vue'

const POSTS_PER_PAGE = 10

const props = defineProps<{
  posts: Array<{
    title: string
    slug: string
    date: string
    description: string
    tags: string[]
  }>
}>()

const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(props.posts.length / POSTS_PER_PAGE))
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * POSTS_PER_PAGE
  return props.posts.slice(start, start + POSTS_PER_PAGE)
})
const showPagination = computed(() => totalPages.value > 1)

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

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
  <div v-if="posts.length > 0">
    <div class="flex flex-col">
      <a
        v-for="post in paginatedPosts"
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

    <div
      v-if="showPagination"
      class="flex items-center justify-between mt-8 pt-4 border-t border-[var(--color-border)]"
    >
      <button
        :disabled="currentPage <= 1"
        class="text-sm px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        @click="prevPage"
      >
        Previous
      </button>
      <span class="text-sm text-[var(--color-text-tertiary)]">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        :disabled="currentPage >= totalPages"
        class="text-sm px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        @click="nextPage"
      >
        Next
      </button>
    </div>
  </div>
  <p v-else class="py-8 text-center text-[var(--color-text-secondary)]">No posts found.</p>
</template>
