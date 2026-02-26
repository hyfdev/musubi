<script setup lang="ts">
import { Head, Meta, Title } from '#components'
import { useHomePageData } from '~/composables/useHomePageData'

const homePageData = await useHomePageData()

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

    <div v-if="homePageData.posts.length > 0" class="flex flex-col">
      <a
        v-for="post in homePageData.posts"
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
          <a
            v-for="tag in post.tags"
            :key="tag"
            :href="`/tags/${tag}`"
            class="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text)] transition-colors"
            @click.stop
          >
            {{ tag }}
          </a>
        </div>
      </a>
    </div>
    <p v-else class="py-8 text-center text-[var(--color-text-secondary)]">No posts found.</p>
  </div>
</template>
