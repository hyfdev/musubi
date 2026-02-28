<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { ExtendedRecordMap } from 'notion-types'
import * as React from 'react'
import * as ReactDomClient from 'react-dom/client'
import { NotionRenderer } from 'react-notion-x'
import { Tweet as ReactTweet } from 'react-tweet'
import 'prismjs'
import 'prismjs/components/prism-rust.js'
import 'prismjs/components/prism-markdown.js'
import { Code } from 'react-notion-x/build/third-party/code'

const props = defineProps<{
  recordMap: ExtendedRecordMap
  serverHtml: string
  darkMode?: boolean
  serverDarkMode?: boolean
}>()

const root = ref<HTMLDivElement | null>(null)

const HydrationContainer: React.FC<{
  children?: React.ReactNode[]
  onHydrationCompleted?: () => void
}> = ({ children, onHydrationCompleted }) => {
  React.useLayoutEffect(() => {
    onHydrationCompleted?.()
  }, [])
  return children
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createNotionRendererElement(
  Code: React.ComponentType<any>,
  darkMode?: boolean,
  onHydrationCompleted?: () => void,
) {
  return React.createElement(
    HydrationContainer,
    {
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
    }),
  )
}

onMounted(() => {
  const darkModeMismatch = props.darkMode !== props.serverDarkMode
  if (root.value != null) {
    const rootDomElm = root.value
    let isUnmounted = false

    const notionRendererElmRef = computed(() => createNotionRendererElement(Code, props.darkMode))

    const elmForHydration = darkModeMismatch
      ? createNotionRendererElement(Code, props.serverDarkMode, () => {
          reactRoot.render(notionRendererElmRef.value)
        })
      : notionRendererElmRef.value

    const reactRoot = ReactDomClient.hydrateRoot(rootDomElm, elmForHydration)

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
  <div ref="root" v-html="serverHtml" class="notion-content"></div>
</template>
