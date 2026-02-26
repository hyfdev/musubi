<script setup lang="ts">
import { Head, Meta, Title } from '#components'
import { useTagPageData } from '~/composables/useTagPageData'

const tagPageData = await useTagPageData()

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <Head>
    <Title>{{ tagPageData.tag }} | {{ tagPageData.websiteTitle }}</Title>
    <Meta property="og:title" :content="`${tagPageData.tag} | ${tagPageData.websiteTitle}`" />
    <Meta property="og:type" content="website" />
    <Meta name="twitter:card" content="summary" />
    <Meta name="twitter:title" :content="`${tagPageData.tag} | ${tagPageData.websiteTitle}`" />
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
      {{ tagPageData.posts.length }} {{ tagPageData.posts.length === 1 ? 'post' : 'posts' }}
    </p>

    <div v-if="tagPageData.posts.length > 0" class="flex flex-col">
      <a
        v-for="post in tagPageData.posts"
        :key="post.slug"
        :href="`/blog/${post.slug}`"
        class="group flex flex-col gap-1 py-3 -mx-3 px-3 rounded-md no-underline hover:bg-[var(--color-bg-subtle)] transition-colors"
      >
        <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <span
            class="text-base font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent)]"
          >
            {{ post.title }}
          </span>
          <time class="text-sm text-[var(--color-text-tertiary)] tabular-nums whitespace-nowrap">
            {{ formatDate(post.date) }}
          </time>
        </div>
        <p
          v-if="post.description"
          class="text-sm text-[var(--color-text-secondary)] line-clamp-2 m-0"
        >
          {{ post.description }}
        </p>
        <div v-if="post.tags.length > 0" class="flex flex-wrap gap-1.5 mt-1">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]"
          >
            {{ tag }}
          </span>
        </div>
      </a>
    </div>
    <p v-else class="py-8 text-center text-[var(--color-text-secondary)]">
      No posts found with this tag.
    </p>
  </div>
</template>
