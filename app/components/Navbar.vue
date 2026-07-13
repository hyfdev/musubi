<script setup lang="ts">
import type { NavigationItem, SiteConfig } from '../lib/site/types.ts'
import ColorModeToggle from './ColorModeToggle.vue'

defineProps<{
  config: SiteConfig
  navigation: NavigationItem[]
}>()
</script>

<template>
  <header class="site-header">
    <div class="shell site-header-inner">
      <a class="site-brand" href="/">
        <span class="signature-rule" aria-hidden="true"></span>
        <span>{{ config.title }}</span>
      </a>
      <div class="site-header-actions">
        <nav class="site-navigation" aria-label="Primary navigation">
          <a href="/">Articles</a>
          <a v-for="item in navigation" :key="item.route" :href="item.route">{{ item.title }}</a>
        </nav>
        <nav class="social-navigation" aria-label="Social links">
          <a :href="config.github" target="_blank" rel="noreferrer">GitHub</a>
          <a :href="config.x" target="_blank" rel="noreferrer">X</a>
        </nav>
        <ColorModeToggle />
      </div>
    </div>
  </header>
</template>