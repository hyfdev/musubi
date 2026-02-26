<script setup lang="ts">
import { useRoute, createError } from '#imports'
import { Head, Meta, Title } from '#components'
import { useTagPageData } from '~/composables/useTagPageData'
import PostList from '~/components/PostList.vue'
import PaginationNav from '~/components/PaginationNav.vue'

const route = useRoute()
const page = Number(route.params.page)

if (!Number.isInteger(page) || page < 2) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  })
}

const tagPageData = await useTagPageData(page)
</script>

<template>
  <Head>
    <Title
      >{{ tagPageData.tag }} - Page {{ tagPageData.currentPage }} |
      {{ tagPageData.websiteTitle }}</Title
    >
    <Meta
      property="og:title"
      :content="`${tagPageData.tag} - Page ${tagPageData.currentPage} | ${tagPageData.websiteTitle}`"
    />
    <Meta property="og:type" content="website" />
    <Meta name="twitter:card" content="summary" />
    <Meta
      name="twitter:title"
      :content="`${tagPageData.tag} - Page ${tagPageData.currentPage} | ${tagPageData.websiteTitle}`"
    />
  </Head>
  <div class="py-8">
    <div class="mb-6">
      <a
        href="/tags"
        class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] no-underline"
      >
        &larr; All tags
      </a>
    </div>

    <h2
      class="text-sm font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1"
    >
      Posts tagged
    </h2>
    <h1 class="text-2xl font-bold text-[var(--color-text)] mb-1">{{ tagPageData.tag }}</h1>
    <p class="text-sm text-[var(--color-text-tertiary)] mb-6">
      {{ tagPageData.totalPosts }} {{ tagPageData.totalPosts === 1 ? 'post' : 'posts' }}
    </p>

    <PostList :posts="tagPageData.posts" />
    <PaginationNav
      :current-page="tagPageData.currentPage"
      :total-pages="tagPageData.totalPages"
      :first-page-url="`/tags/${tagPageData.tag}`"
      :page-base-url="`/tags/${tagPageData.tag}/page`"
    />
  </div>
</template>
