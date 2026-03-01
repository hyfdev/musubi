<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  author?: string
  since?: string
}>()

const copyrightYear = computed(() => {
  const currentYear = String(new Date().getFullYear())
  if (props.since && props.since !== currentYear) {
    return `${props.since}\u2013${currentYear}`
  }
  return currentYear
})
</script>

<template>
  <footer class="mt-24 pb-10 pt-6">
    <div class="max-w-[var(--site-width)] mx-auto px-4 sm:px-6">
      <div
        class="border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-[var(--color-text-tertiary)]"
      >
        <span>&copy; {{ copyrightYear }} {{ author }}</span>
        <p class="flex items-center gap-1">
          Powered by
          <a
            href="https://github.com/hyf0/musubi"
            target="_blank"
            class="font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] no-underline transition-colors"
            >Musubi</a
          >
        </p>
      </div>
    </div>
  </footer>
</template>
