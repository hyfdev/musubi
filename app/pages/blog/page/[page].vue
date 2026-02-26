<script setup lang="ts">
import { Head, Meta, Title } from '#components'
import { useBlogPageData } from '~/composables/useBlogPageData'
import PostList from '~/components/PostList.vue'
import PaginationNav from '~/components/PaginationNav.vue'

const blogPageData = await useBlogPageData()
</script>

<template>
  <Head>
    <Title>Posts - Page {{ blogPageData.currentPage }} | {{ blogPageData.websiteTitle }}</Title>
    <Meta
      property="og:title"
      :content="`Posts - Page ${blogPageData.currentPage} | ${blogPageData.websiteTitle}`"
    />
    <Meta property="og:type" content="website" />
    <Meta name="twitter:card" content="summary" />
    <Meta
      name="twitter:title"
      :content="`Posts - Page ${blogPageData.currentPage} | ${blogPageData.websiteTitle}`"
    />
  </Head>
  <div class="py-8">
    <h2
      class="text-sm font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-6"
    >
      Posts
    </h2>

    <PostList :posts="blogPageData.posts" />
    <PaginationNav
      :current-page="blogPageData.currentPage"
      :total-pages="blogPageData.totalPages"
      first-page-url="/"
      page-base-url="/blog/page"
    />
  </div>
</template>
