<script setup lang="ts">
import { createError, useFetch, useHead, useRoute } from '#imports'
import ContentPage from '../components/ContentPage.vue'

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
if (error.value || !data.value || data.value.page.meta.type !== 'Content') {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', cause: error.value })
}
const response = data.value
const canonical = new URL(response.page.meta.route, response.config.link).toString()

useHead({
  title: response.page.meta.title,
  link: [{ rel: 'canonical', href: canonical }],
  meta: [
    { name: 'description', content: response.page.meta.description || response.config.description },
    { property: 'og:title', content: response.page.meta.title },
    {
      property: 'og:description',
      content: response.page.meta.description || response.config.description,
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical },
  ],
})
</script>

<template>
  <ContentPage :page="response.page" />
</template>