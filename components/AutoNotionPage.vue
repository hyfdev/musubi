<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode } from '@vueuse/core'
import NotionPage from './NotionPage.vue'
import type { ExtendedRecordMap } from 'notion-types'

const props = defineProps<{
  recordMap: ExtendedRecordMap
  serverHtml: string
  serverDarkMode?: boolean
}>()

const mode = useColorMode()

const isDark = computed(() => {
  return mode.value === 'dark'
})
</script>

<template>
  <NotionPage
    :dark-mode="isDark"
    :record-map="props.recordMap"
    :server-html="props.serverHtml"
    :server-dark-mode="props.serverDarkMode"
  />
</template>
