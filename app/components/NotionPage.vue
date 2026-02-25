<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
import { usePrerenderData } from 'nuxt-prerender-kit/runtime'
import { createNotionPageKey } from '~/utils/keysForUseAsyncData'
import type { ExtendedRecordMap } from 'notion-types'
import * as React from 'react'
import * as ReactDomClient from 'react-dom/client'
import { NotionRenderer } from 'react-notion-x'
import { Code } from 'react-notion-x/build/third-party/code'
import { Tweet as ReactTweet } from 'react-tweet'
import 'prismjs/components/prism-rust.js'
import 'prismjs/components/prism-markdown.js'

const props = defineProps<{
  recordMap: ExtendedRecordMap
  pageId: string
  darkMode?: boolean
}>()
const rootDomElmRef = useTemplateRef<HTMLDivElement>('root')

const HydrationContainer: React.FC<{ children?: React.ReactNode[], onHydrationCompleted?: () => void }> = ({ children, onHydrationCompleted }) => {
  React.useLayoutEffect(() => {
    onHydrationCompleted?.()
  }, [])
  return children
}

function createNotionRendererElement(darkMode?: boolean, onHydrationCompleted?: () => void) {
  return React.createElement(HydrationContainer, {
    onHydrationCompleted,
  },
    React.createElement(NotionRenderer, {
      recordMap: props.recordMap,
      fullPage: false,
      darkMode: darkMode ?? false,
      components: {
        Collection: () => null,
        Tweet({ id }: { id: string }) {
          return React.createElement(ReactTweet, { id })
        },
        Code,
      },
    })
  )
}

const notionRendererElmRef = computed(() => createNotionRendererElement(props.darkMode))

const { html: serverRenderedNotionHtml, darkMode: serverDarkMode } = await usePrerenderData(
  createNotionPageKey(props.pageId),
  async () => {
    const { renderToString } = await import('react-dom/server')
    const html = renderToString(notionRendererElmRef.value)
    return { html, darkMode: props.darkMode ?? false }
  },
)

const serverRenderedHtml = import.meta.env.SSR
  ? serverRenderedNotionHtml!
  : undefined

onMounted(() => {
  const darkModeMismatch = props.darkMode !== serverDarkMode;
  if (rootDomElmRef.value != null) {
    const rootDomElm = rootDomElmRef.value
    let isUnmounted = false

    const elmForHydration = darkModeMismatch
      ? createNotionRendererElement(serverDarkMode, () => {
        reactRoot.render(notionRendererElmRef.value)
      })
      : notionRendererElmRef.value

    const reactRoot = ReactDomClient.hydrateRoot(rootDomElm, elmForHydration);

    watch(notionRendererElmRef, (newElm) => {
      if (isUnmounted) return
      reactRoot.render(newElm)
    })

    onBeforeUnmount(() => {
      isUnmounted = true
      reactRoot.unmount()
    })
  }
})
</script>

<template>
  <div ref="root" v-html="serverRenderedHtml" class="notion-content"></div>
</template>
