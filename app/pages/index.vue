<script setup lang="ts">
import { createError, useFetch, useHead } from '#imports'
import PaginationNav from '../components/PaginationNav.vue'
import PostList from '../components/PostList.vue'

const { data, error } = await useFetch('/api/build/index/1', { key: 'post-index-1' })
if (error.value || !data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'The article index could not be loaded',
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
  <section class="index-page shell">
    <header class="index-header">
      <p class="section-label"><span aria-hidden="true"></span>Writing</p>
      <div class="index-header-grid">
        <h1>Articles</h1>
        <p>{{ page.config.description }}</p>
      </div>
    </header>
    <PostList :posts="page.index.posts" :config="page.config" />
    <PaginationNav :page="page.index.page" :page-count="page.pageCount" />
  </section>
</template>