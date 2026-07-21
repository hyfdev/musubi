<script setup lang="ts">
import { createError, useFetch, useHead } from '#imports'
import ContentRenderer from '../components/content/ContentRenderer.vue'
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
  <div class="home-page reading-column">
    <!-- The Home row's Title stays unrendered: Home carries no visible H1. -->
    <div v-if="page.home" class="home-intro">
      <ContentRenderer :document="page.home.document" />
    </div>
    <!--
      The index is subordinate to the opening, not a second region beside it: its own small label
      owns it, so it needs no rule, and its entries nest under that label at `h3`.
    -->
    <section v-if="page.posts.length" class="home-recent">
      <h2 lang="en">Recent</h2>
      <!-- Home has no year grouping, so each date keeps its year. -->
      <PostList :posts="page.posts" :config="page.config" :heading-level="3" />
      <!-- The visible mark is punctuation, so the accessible name has to carry the meaning. -->
      <p v-if="page.hasMorePosts" class="home-more-posts">
        <a href="/blog" lang="en" aria-label="More posts">…</a>
      </p>
    </section>
  </div>
</template>