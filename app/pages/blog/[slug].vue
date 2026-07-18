<script setup lang="ts">
import { createError, useFetch, useHead, useRoute } from '#imports'
import PostPage from '../../components/PostPage.vue'

const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
if (!slug) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}
const pageRoute = `/blog/${slug}`
const { data, error } = await useFetch('/api/build/page', {
  key: `published-page:${pageRoute}`,
  query: { route: pageRoute },
})
if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found', cause: error.value })
}
const response = data.value
const page = response.page
if (page.type !== 'Post') {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}
const canonical = new URL(page.route, response.config.link).toString()

useHead({
  title: page.title,
  link: [{ rel: 'canonical', href: canonical }],
  meta: [
    { name: 'description', content: page.description || response.config.description },
    { property: 'og:title', content: page.title },
    {
      property: 'og:description',
      content: page.description || response.config.description,
    },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: canonical },
  ],
})
</script>

<template>
  <PostPage :page="page" :config="response.config" />
</template>