<script setup lang="ts">
import { createError, useFetch, useHead } from '#imports'
import PostList from '../components/PostList.vue'

const { data, error } = await useFetch('/api/build/home', { key: 'musubi-home' })
if (error.value || !data.value) {
  throw createError({
    status: 500,
    statusText: 'The Home page could not be loaded',
    cause: error.value,
  })
}
const page = data.value

useHead({
  title: page.config.title,
  link: [{ rel: 'canonical', href: page.config.link }],
  meta: [
    { property: 'og:title', content: page.config.title },
    { property: 'og:description', content: page.config.description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: page.config.link },
  ],
})
</script>

<template>
  <section class="home-page reading-column" aria-labelledby="recent-posts-label">
    <span id="recent-posts-label" class="visually-hidden" lang="en">Recent posts</span>
    <template v-if="page.posts.length">
      <PostList :posts="page.posts" :config="page.config" />
      <p v-if="page.hasMorePosts" class="home-more-posts" lang="en">
        <a href="/blog">More posts</a>
      </p>
    </template>
    <p v-else class="empty-state" lang="en">No posts have been published yet.</p>
  </section>
</template>