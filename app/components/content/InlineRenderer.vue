<script setup lang="ts">
import type { MusubiInline } from '../../lib/content/types.ts'
import TypographyText from '../TypographyText.vue'

defineProps<{
  nodes: readonly MusubiInline[]
}>()

function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url)
}
</script>

<template>
  <template v-for="(node, index) in nodes" :key="`${node.type}-${index}`">
    <TypographyText v-if="node.type === 'text'" :value="node.value" />
    <strong v-else-if="node.type === 'strong'">
      <InlineRenderer :nodes="node.children" />
    </strong>
    <em v-else-if="node.type === 'emphasis'">
      <InlineRenderer :nodes="node.children" />
    </em>
    <del v-else-if="node.type === 'delete'">
      <InlineRenderer :nodes="node.children" />
    </del>
    <code v-else-if="node.type === 'inlineCode'">{{ node.value }}</code>
    <br v-else-if="node.type === 'break'" />
    <a
      v-else-if="node.type === 'link'"
      :href="node.url"
      :target="isExternal(node.url) ? '_blank' : undefined"
      :rel="isExternal(node.url) ? 'noopener noreferrer' : undefined"
    >
      <InlineRenderer :nodes="node.children" />
    </a>
  </template>
</template>