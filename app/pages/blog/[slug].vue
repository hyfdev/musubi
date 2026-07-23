<script setup lang="ts">
import PostPage from '../../components/PostPage.vue'
import type { PostPageProps } from '#shared/site/public'

const response = defineProps<PostPageProps>()
</script>

<template>
  <PostPage :page="response.page" :config="response.config" />
</template>