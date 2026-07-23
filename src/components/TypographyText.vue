<script setup lang="ts">
import { computed } from 'vue'
import { segmentChineseTypographyText } from '#shared/chinese-typography.ts'

const props = defineProps<{
  value: string
  context?: string
  contextStart?: number
}>()

const segments = computed(() =>
  segmentChineseTypographyText(props.value, props.context ?? props.value, props.contextStart ?? 0),
)
</script>

<template>
  <span
    v-for="(segment, index) in segments"
    :key="index"
    :class="segment.cjk ? 'cjk-text' : undefined"
    >{{ segment.value }}</span
  >
</template>