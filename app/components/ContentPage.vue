<script setup lang="ts">
import { Head, Meta, Title } from '#components'
import { useContentPageData } from '~/composables/useContentPageData'
import AutoNotionPage from '~/components/AutoNotionPage.vue'

const contentPageData = await useContentPageData()

const pageMeta = contentPageData.page.meta
</script>

<template>
  <Head>
    <Title>{{ pageMeta.title }} | {{ contentPageData.websiteTitle }}</Title>
    <Meta property="og:title" :content="pageMeta.title" />
    <Meta v-if="pageMeta.description" property="og:description" :content="pageMeta.description" />
    <Meta property="og:type" content="website" />
    <Meta name="twitter:card" content="summary" />
    <Meta name="twitter:title" :content="pageMeta.title" />
    <Meta v-if="pageMeta.description" name="twitter:description" :content="pageMeta.description" />
    <Meta v-if="pageMeta.description" name="description" :content="pageMeta.description" />
  </Head>
  <article class="max-w-[var(--content-width)] mx-auto py-8">
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-[var(--color-text)] tracking-tight leading-tight">
        {{ pageMeta.title }}
      </h1>
    </header>

    <AutoNotionPage
      :record-map="contentPageData.page.recordMap"
      :page-id="contentPageData.page.meta.pageId"
    />
  </article>
</template>
