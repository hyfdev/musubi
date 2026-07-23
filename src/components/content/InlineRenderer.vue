<script setup lang="ts">
import { computed, inject } from 'vue'
import { extractInlineTypographyContext } from '#shared/content/corpus.ts'
import type { MusubiInline } from '#shared/content/types'
import { isExternalSiteLink, siteLinkKey } from '../../lib/site/link.ts'
import TypographyText from '../TypographyText.vue'

const props = defineProps<{
  nodes: readonly MusubiInline[]
  context?: string
  contextStart?: number
}>()

const siteLink = inject(siteLinkKey, 'https://musubi.invalid/')
const context = computed(() => props.context ?? extractInlineTypographyContext(props.nodes))
const contextStart = computed(() => props.contextStart ?? 0)
const nodeStarts = computed(() => {
  let offset = contextStart.value
  return props.nodes.map((node) => {
    const start = offset
    offset += extractInlineTypographyContext([node]).length
    return start
  })
})
</script>

<template>
  <template v-for="(node, index) in nodes" :key="`${node.type}-${index}`">
    <TypographyText
      v-if="node.type === 'text'"
      :value="node.value"
      :context="context"
      :context-start="nodeStarts[index]"
    />
    <strong v-else-if="node.type === 'strong'">
      <InlineRenderer
        :nodes="node.children"
        :context="context"
        :context-start="nodeStarts[index]"
      />
    </strong>
    <em v-else-if="node.type === 'emphasis'">
      <InlineRenderer
        :nodes="node.children"
        :context="context"
        :context-start="nodeStarts[index]"
      />
    </em>
    <del v-else-if="node.type === 'delete'">
      <InlineRenderer
        :nodes="node.children"
        :context="context"
        :context-start="nodeStarts[index]"
      />
    </del>
    <code v-else-if="node.type === 'inlineCode'">{{ node.value }}</code>
    <br v-else-if="node.type === 'break'" />
    <a
      v-else-if="node.type === 'link'"
      :href="node.url"
      :target="isExternalSiteLink(node.url, siteLink) ? '_blank' : undefined"
      :rel="isExternalSiteLink(node.url, siteLink) ? 'noopener noreferrer' : undefined"
    >
      <InlineRenderer
        :nodes="node.children"
        :context="context"
        :context-start="nodeStarts[index]"
      />
    </a>
  </template>
</template>