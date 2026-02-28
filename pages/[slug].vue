<script setup lang="ts">
import AppLayout from '../components/AppLayout.vue'
import ContentPage from '../components/ContentPage.vue'
import type { Props } from './[slug].server'

const props = defineProps<Props>()
</script>

<template>
  <AppLayout :shared="props.shared">
    <ContentPage
      :website-title="props.websiteTitle"
      :page="props.page"
      :notion-html="props.notionHtml"
      :server-dark-mode="props.serverDarkMode"
    />
  </AppLayout>
</template>
