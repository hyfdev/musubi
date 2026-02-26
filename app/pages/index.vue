<script setup lang="ts">
import { Head, Meta, Title } from '#components'
import { useHomePageData } from '~/composables/useHomePageData'
import PostList from '~/components/PostList.vue'

const homePageData = await useHomePageData()
</script>

<template>
  <Head>
    <Title>{{ homePageData.websiteTitle }}</Title>
    <Meta property="og:title" :content="homePageData.websiteTitle" />
    <Meta property="og:type" content="website" />
    <Meta name="twitter:card" content="summary" />
    <Meta name="twitter:title" :content="homePageData.websiteTitle" />
    <Meta
      v-if="homePageData.websiteDescription"
      property="og:description"
      :content="homePageData.websiteDescription"
    />
    <Meta
      v-if="homePageData.websiteDescription"
      name="twitter:description"
      :content="homePageData.websiteDescription"
    />
  </Head>
  <div class="py-8">
    <h2
      class="text-sm font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-6"
    >
      Posts
    </h2>

    <PostList :posts="homePageData.posts" />
  </div>
</template>
