<script setup lang="ts">
import AppLayout from '../../../../components/AppLayout.vue'
import PostList from '../../../../components/PostList.vue'
import PaginationNav from '../../../../components/PaginationNav.vue'
import type { Props } from './[page].server'

const props = defineProps<Props>()
</script>

<template>
  <AppLayout :shared="props.shared">
    <div class="py-10">
      <div class="mb-5">
        <a
          href="/tags"
          class="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] no-underline transition-colors"
        >
          &larr; All tags
        </a>
      </div>

      <h2
        class="text-[13px] font-[var(--font-display)] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1"
      >
        Posts tagged
      </h2>
      <h1
        class="text-2xl font-[var(--font-display)] font-bold text-[var(--color-text)] tracking-[-0.01em] mb-1"
      >
        {{ props.tag }}
      </h1>
      <p class="text-sm text-[var(--color-text-tertiary)] mb-6">
        {{ props.totalPosts }} {{ props.totalPosts === 1 ? 'post' : 'posts' }}
      </p>

      <PostList :posts="props.posts" />
      <PaginationNav
        :current-page="props.currentPage"
        :total-pages="props.totalPages"
        :first-page-url="`/tags/${props.tag}`"
        :page-base-url="`/tags/${props.tag}/page`"
      />
    </div>
  </AppLayout>
</template>
