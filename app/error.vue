<script setup lang="ts">
import type { NuxtError } from '#app'
import { useHead } from '#imports'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = props.error.statusCode ?? 500
const notFound = statusCode === 404

useHead({
  title: notFound ? 'Page not found' : 'Publication error',
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <main class="error-page shell">
    <p class="section-label"><span aria-hidden="true"></span>{{ statusCode }}</p>
    <h1>{{ notFound ? 'Page not found' : 'Something went wrong' }}</h1>
    <p>
      {{
        notFound
          ? 'The page you requested does not exist or is not published.'
          : 'This page could not be rendered.'
      }}
    </p>
    <a href="/">Back to the article index</a>
  </main>
</template>