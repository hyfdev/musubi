<script setup lang="ts">
import { computed } from 'vue'
import { createError, useFetch, useHead } from '#imports'
import PostList from '../../components/PostList.vue'
import { formatPublishedYear } from '#shared/site/format'
import type { PublicPageMeta } from '#shared/site/types'

const { data, error } = await useFetch('/api/build/blog', { key: 'musubi-blog' })
if (error.value || !data.value) {
  throw createError({
    status: 500,
    statusText: 'The Blog page could not be loaded',
    cause: error.value,
  })
}
const page = data.value
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
const canonical = new URL('/blog', page.config.link).toString()

useHead({
  title: 'Blog',
  link: [{ rel: 'canonical', href: canonical }],
  meta: [
    { property: 'og:title', content: `Blog — ${page.config.title}` },
    { property: 'og:description', content: page.config.description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical },
  ],
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