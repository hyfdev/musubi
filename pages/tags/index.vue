<script setup lang="ts">
import AppLayout from '../../components/AppLayout.vue'
import type { Props } from './index.server'

const props = defineProps<Props>()
</script>

<template>
  <AppLayout :shared="props.shared">
    <div class="py-8">
      <h2
        class="text-sm font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-6"
      >
        Tags
      </h2>

      <div v-if="props.tags.length > 0" class="flex flex-wrap gap-3">
        <a
          v-for="tag in props.tags"
          :key="tag.name"
          :href="`/tags/${tag.name}`"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-text)] transition-colors"
        >
          <span class="text-sm font-medium">{{ tag.name }}</span>
          <span class="text-xs text-[var(--color-text-tertiary)]">{{ tag.count }}</span>
        </a>
      </div>
      <p v-else class="py-8 text-center text-[var(--color-text-secondary)]">No tags found.</p>
    </div>
  </AppLayout>
</template>
