<script setup lang="ts">
import { createError, useFetch, useHead, useRoute } from '#imports'
import PagePage from '../components/PagePage.vue'

const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
if (!slug) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}
const pageRoute = `/${slug}`
const { data, error } = await useFetch('/api/build/page', {
  key: `published-page:${pageRoute}`,
  query: { route: pageRoute },
})
if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', cause: error.value })
}
const response = data.value
const page = response.page
if (page.type !== 'Page') {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
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
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical },
  ],
})
</script>

<template>
  <PagePage :page="page" />
</template>