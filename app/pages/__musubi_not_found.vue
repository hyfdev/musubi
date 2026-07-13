<script setup lang="ts">
import { useHead } from '#imports'

useHead({
  title: 'Page not found',
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <section class="error-page shell">
    <p class="section-label"><span aria-hidden="true"></span>404</p>
    <h1>Page not found</h1>
    <p>The page you requested does not exist or is not published.</p>
    <a href="/">Back to the article index</a>
  </section>
</template>