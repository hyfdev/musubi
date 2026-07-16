<script setup lang="ts">
import { useHead } from '#imports'

useHead({
  title: 'Page not found',
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <section class="error-page reading-column" lang="en">
    <h1>Page not found</h1>
    <p>The page you requested does not exist or is not published.</p>
    <a href="/">Back to Home</a>
  </section>
</template>