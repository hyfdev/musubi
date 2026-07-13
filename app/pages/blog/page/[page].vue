<script setup lang="ts">
import { createError, useFetch, useHead, useRoute } from '#imports'
import PaginationNav from '../../../components/PaginationNav.vue'
import PostList from '../../../components/PostList.vue'

const route = useRoute()
const rawPage = Array.isArray(route.params.page) ? route.params.page[0] : route.params.page
const pageNumber = Number(rawPage)
if (!Number.isSafeInteger(pageNumber) || pageNumber < 2 || String(pageNumber) !== rawPage) {
  throw createError({ statusCode: 404, statusMessage: 'Article index page not found' })
}

const { data, error } = await useFetch(`/api/build/index/${pageNumber}`, {
  key: `post-index-${pageNumber}`,
})
if (error.value || !data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Article index page not found',
    cause: error.value,
  })
}
const page = data.value
const canonical = new URL(page.index.route, page.config.link).toString()

useHead({
  title: `Articles · Page ${pageNumber}`,
  link: [{ rel: 'canonical', href: canonical }],
  meta: [
    { property: 'og:title', content: `Articles · Page ${pageNumber}` },
    { property: 'og:description', content: page.config.description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical },
  ],
})
</script>

<template>
  <section class="index-page shell">
    <header class="index-header">
      <p class="section-label"><span aria-hidden="true"></span>Writing</p>
      <div class="index-header-grid">
        <h1>Articles</h1>
        <p>Page {{ page.index.page }}</p>
      </div>
    </header>
    <PostList :posts="page.index.posts" :config="page.config" />
    <PaginationNav :page="page.index.page" :page-count="page.pageCount" />
  </section>
</template>