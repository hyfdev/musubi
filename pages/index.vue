<script setup lang="ts">
import AppLayout from '../components/AppLayout.vue'
import PostList from '../components/PostList.vue'
import PaginationNav from '../components/PaginationNav.vue'
import type { Props } from './index.server'

const props = defineProps<Props>()
</script>

<template>
  <AppLayout :shared="props.shared">
    <div class="py-10">
      <h2
        class="text-[13px] font-[var(--font-display)] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-5"
      >
        Posts
      </h2>

      <PostList :posts="props.posts" />
      <PaginationNav
        :current-page="props.currentPage"
        :total-pages="props.totalPages"
        first-page-url="/"
        page-base-url="/blog/page"
      />
    </div>
  </AppLayout>
</template>
