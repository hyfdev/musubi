<script setup lang="ts">
import { computed } from 'vue'
import PostList from '../../components/PostList.vue'
import { formatPublishedYear } from '#shared/site/format'
import type { BlogPageProps } from '#shared/site/public'
import type { PublicPageMeta } from '#shared/site/types'

const page = defineProps<BlogPageProps>()
const groups = computed(() => {
  const byYear = new Map<string, PublicPageMeta[]>()
  for (const post of page.posts) {
    const year = post.date ? formatPublishedYear(post.date, page.config) : 'Undated'
    const entries = byYear.get(year) ?? []
    entries.push(post)
    byYear.set(year, entries)
  }
  return [...byYear].map(([year, posts]) => ({ year, posts }))
})
</script>

<template>
  <section class="blog-page reading-column">
    <h1 lang="en">Blog</h1>
    <div v-if="groups.length" class="blog-archive">
      <section v-for="group in groups" :key="group.year" class="blog-year">
        <h2>{{ group.year }}</h2>
        <PostList
          :posts="group.posts"
          :config="page.config"
          :heading-level="3"
          date-style="month-day"
        />
      </section>
    </div>
    <p v-else class="empty-state" lang="en">No posts have been published yet.</p>
  </section>
</template>