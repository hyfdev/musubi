<script setup lang="ts">
import { computed } from 'vue'
import { isChineseTypographyCharacter } from '#shared/chinese-typography.ts'

const props = defineProps<{
  value: string
}>()

const segments = computed(() => {
  const result: { value: string; cjk: boolean }[] = []
  for (const character of props.value) {
    const cjk = isChineseTypographyCharacter(character)
    const previous = result.at(-1)
    if (previous?.cjk === cjk) previous.value += character
    else result.push({ value: character, cjk })
  }
  return result
})
</script>

<template>
  <span
    v-for="(segment, index) in segments"
    :key="index"
    :class="segment.cjk ? 'cjk-text' : undefined"
    >{{ segment.value }}</span
  >
</template>