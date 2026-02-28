<script setup lang="ts">
import AppLayout from '../../components/AppLayout.vue'
import PostPage from '../../components/PostPage.vue'
import type { Props } from './[slug].server'

const props = defineProps<Props>()
</script>

<template>
  <AppLayout :shared="props.shared">
    <PostPage
      :website-title="props.websiteTitle"
      :post="props.post"
      :notion-html="props.notionHtml"
      :server-dark-mode="props.serverDarkMode"
    />
  </AppLayout>
</template>
