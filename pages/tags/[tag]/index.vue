<script setup lang="ts">
import AppLayout from '../../../components/AppLayout.vue'
import PostList from '../../../components/PostList.vue'
import PaginationNav from '../../../components/PaginationNav.vue'
import type { Props } from './index.server'

const props = defineProps<Props>()
</script>

<template>
  <AppLayout :shared="props.shared">
    <div class="py-8">
      <div class="mb-6">
        <a
          href="/tags"
          class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] no-underline"
        >
          &larr; All tags
        </a>
      </div>

      <h2
        class="text-sm font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1"
      >
        Posts tagged
      </h2>
      <h1 class="text-2xl font-bold text-[var(--color-text)] mb-1">{{ props.tag }}</h1>
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
