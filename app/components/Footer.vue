<script setup lang="ts">
import type { SiteConfig } from '../lib/site/types.ts'
import TypographyText from './TypographyText.vue'

defineProps<{
  config: SiteConfig
}>()

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="shell site-footer-inner">
      <p>© {{ currentYear }} <TypographyText :value="config.author" /></p>
      <p lang="en">
        Built with
        <a href="https://github.com/hyf0/musubi" target="_blank" rel="noopener noreferrer"
          >Musubi</a
        >
      </p>
    </div>
  </footer>
</template>