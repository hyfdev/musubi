<script setup lang="ts">
import PagePage from '../components/PagePage.vue'
import type { StandalonePageProps } from '#shared/site/public'

const response = defineProps<StandalonePageProps>()
</script>

<template>
  <PagePage :page="response.page" />
</template>