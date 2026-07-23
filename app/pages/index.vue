<script setup lang="ts">
import ContentRenderer from '../components/content/ContentRenderer.vue'
import PostList from '../components/PostList.vue'
import type { HomePageProps } from '#shared/site/public'

const page = defineProps<HomePageProps>()
</script>

<template>
  <div class="home-page reading-column">
    <!-- The Home row's Title stays unrendered: Home carries no visible H1. -->
    <div v-if="page.home" class="home-intro">
      <ContentRenderer :document="page.home.document" />
    </div>
    <!--
      The index is subordinate to the opening, not a second region beside it: its own small label
      owns it, so it needs no rule, and its entries nest under that label at `h3`.
    -->
    <section v-if="page.posts.length" class="home-recent">
      <h2 lang="en">Recent</h2>
      <!-- Home has no year grouping, so each date keeps its year. -->
      <PostList :posts="page.posts" :config="page.config" :heading-level="3" />
      <!-- The visible mark is punctuation, so the accessible name has to carry the meaning. -->
      <p v-if="page.hasMorePosts" class="home-more-posts">
        <a href="/blog" lang="en" aria-label="More posts">…</a>
      </p>
    </section>
  </div>
</template>