<script setup lang="ts">
import { formatPublishedDate } from '../lib/site/format.ts'
import type { PublicPageMeta, SiteConfig } from '../lib/site/types.ts'

defineProps<{
  posts: PublicPageMeta[]
  config: SiteConfig
}>()
</script>

<template>
  <div class="post-index-list">
    <article v-for="post in posts" :key="post.route" class="post-index-entry">
      <div class="post-index-copy">
        <h2>
          <a :href="post.route">{{ post.title }}</a>
        </h2>
        <p v-if="post.description">{{ post.description }}</p>
        <p v-if="post.tags.length" class="post-tags">{{ post.tags.join(' · ') }}</p>
      </div>
      <time v-if="post.date" :datetime="post.date">{{
        formatPublishedDate(post.date, config)
      }}</time>
    </article>
  </div>
</template>