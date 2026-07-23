<script setup lang="ts">
import { Link } from '@void/vue'
import { computed } from 'vue'
import { formatPublishedDate, type PublishedDateStyle } from '#shared/site/format'
import type { PublicPageMeta, SiteConfig } from '#shared/site/types'
import TypographyText from './TypographyText.vue'

const props = withDefaults(
  defineProps<{
    posts: PublicPageMeta[]
    config: SiteConfig
    headingLevel?: 2 | 3
    dateStyle?: PublishedDateStyle
  }>(),
  { headingLevel: 2, dateStyle: 'full' },
)

const headingTag = computed(() => `h${props.headingLevel}`)
</script>

<template>
  <div class="post-list">
    <article v-for="post in posts" :key="post.route" class="post-entry">
      <div class="post-title-row">
        <component :is="headingTag">
          <Link :href="post.route"><TypographyText :value="post.title" /></Link>
        </component>
        <time v-if="post.date" :datetime="post.date">{{
          formatPublishedDate(post.date, config, dateStyle)
        }}</time>
      </div>
      <p v-if="post.description" class="post-summary">
        <TypographyText :value="post.description" />
      </p>
    </article>
  </div>
</template>