<script setup lang="ts">
import { Head, Meta, Title } from '#components'
import { usePostPageData } from '~/composables/usePostPageData'
import AutoNotionPage from '~/components/AutoNotionPage.vue'

const postPageData = await usePostPageData()

const postMeta = postPageData.post.meta

const date = new Date(postMeta.date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
</script>

<template>
  <Head>
    <Title>{{ postMeta.title }} | {{ postPageData.websiteTitle }}</Title>
    <Meta property="og:title" :content="postMeta.title" />
    <Meta v-if="postMeta.description" property="og:description" :content="postMeta.description" />
    <Meta property="og:type" content="article" />
    <Meta name="twitter:card" content="summary" />
    <Meta name="twitter:title" :content="postMeta.title" />
    <Meta v-if="postMeta.description" name="twitter:description" :content="postMeta.description" />
    <Meta v-if="postMeta.description" name="description" :content="postMeta.description" />
  </Head>
  <article class="max-w-[var(--content-width)] mx-auto py-8">
    <header class="mb-10">
      <time class="text-sm text-[var(--color-text-tertiary)]">{{ date }}</time>
      <div v-if="postMeta.tags.length > 0" class="flex flex-wrap gap-1.5 mt-2">
        <a
          v-for="tag in postMeta.tags"
          :key="tag"
          :href="`/tags/${tag}`"
          class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text)] transition-colors"
        >
          {{ tag }}
        </a>
      </div>
      <h1 class="text-3xl font-bold mt-2 text-[var(--color-text)] tracking-tight leading-tight">
        {{ postMeta.title }}
      </h1>
      <p v-if="postMeta.description" class="text-base text-[var(--color-text-secondary)] mt-3">
        {{ postMeta.description }}
      </p>
    </header>

    <AutoNotionPage
      :record-map="postPageData.post.recordMap"
      :page-id="postPageData.post.meta.pageId"
    />
  </article>
</template>
