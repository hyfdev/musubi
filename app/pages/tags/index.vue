<script setup lang="ts">
import { Head, Meta, Title } from '#components'
import { useTagsPageData } from '~/composables/useTagsPageData'

const tagsPageData = await useTagsPageData()
</script>

<template>
  <Head>
    <Title>Tags | {{ tagsPageData.websiteTitle }}</Title>
    <Meta property="og:title" :content="`Tags | ${tagsPageData.websiteTitle}`" />
    <Meta property="og:type" content="website" />
    <Meta name="twitter:card" content="summary" />
    <Meta name="twitter:title" :content="`Tags | ${tagsPageData.websiteTitle}`" />
  </Head>
  <div class="py-8">
    <h2
      class="text-sm font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-6"
    >
      Tags
    </h2>

    <div v-if="tagsPageData.tags.length > 0" class="flex flex-wrap gap-3">
      <a
        v-for="tag in tagsPageData.tags"
        :key="tag.name"
        :href="`/tags/${tag.name}`"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text)] transition-colors"
      >
        <span class="text-sm font-medium">{{ tag.name }}</span>
        <span class="text-xs text-[var(--color-text-tertiary)]">{{ tag.count }}</span>
      </a>
    </div>
    <p v-else class="py-8 text-center text-[var(--color-text-secondary)]">No tags found.</p>
  </div>
</template>
