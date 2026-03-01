<script setup lang="ts">
import AppLayout from '../../components/AppLayout.vue'
import type { Props } from './index.server'

const props = defineProps<Props>()
</script>

<template>
  <AppLayout :shared="props.shared">
    <div class="py-10">
      <h2
        class="text-[13px] font-[var(--font-display)] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-5"
      >
        Tags
      </h2>

      <div v-if="props.tags.length > 0" class="flex flex-wrap gap-2.5">
        <a
          v-for="tag in props.tags"
          :key="tag.name"
          :href="`/tags/${tag.name}`"
          class="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] no-underline hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-[0_1px_2px_var(--color-shadow)]"
        >
          <span class="text-sm font-medium">{{ tag.name }}</span>
          <span
            class="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-subtle)] px-1.5 py-0.5 rounded-[var(--radius-sm)]"
            >{{ tag.count }}</span
          >
        </a>
      </div>
      <p v-else class="py-12 text-center text-[var(--color-text-secondary)]">No tags found.</p>
    </div>
  </AppLayout>
</template>
