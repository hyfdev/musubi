<script setup lang="ts">
import { useFooterData } from '~/composables/useFooterData'

const footerData = await useFooterData()
</script>

<template>
  <footer class="mt-20 pb-12 pt-8">
    <div
      class="max-w-[var(--site-width)] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[var(--color-text-tertiary)]"
    >
      <span>&copy; {{ new Date().getFullYear() }} {{ footerData.author }}</span>
      <p class="flex items-center gap-1">
        Powered by
        <a
          href="https://github.com/hyf0/musubi"
          target="_blank"
          class="font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] no-underline"
          >Musubi</a
        >
      </p>
    </div>
  </footer>
</template>
