<script setup lang="ts">
import { useRoute } from '#imports'
import type { NavigationItem, SiteConfig } from '../lib/site/types.ts'
import ColorModeToggle from './ColorModeToggle.vue'
import TypographyText from './TypographyText.vue'

defineProps<{
  config: SiteConfig
  navigation: NavigationItem[]
}>()

const route = useRoute()

function isCurrent(target: string): boolean {
  if (target === '/') return route.path === '/'
  if (target === '/blog') return route.path === '/blog' || route.path.startsWith('/blog/')
  return route.path === target
}
</script>

<template>
  <header class="site-header">
    <div class="shell site-header-inner">
      <a class="site-brand" href="/"><TypographyText :value="config.title" /></a>
      <div class="site-center-viewport">
        <div class="site-center">
          <span id="primary-navigation-label" class="visually-hidden" lang="en"
            >Primary navigation</span
          >
          <nav class="site-navigation" aria-labelledby="primary-navigation-label">
            <a href="/" :aria-current="isCurrent('/') ? 'page' : undefined" lang="en">Home</a>
            <a href="/blog" :aria-current="isCurrent('/blog') ? 'page' : undefined" lang="en"
              >Blog</a
            >
            <a
              v-for="item in navigation"
              :key="item.route"
              :href="item.route"
              :aria-current="isCurrent(item.route) ? 'page' : undefined"
            >
              <TypographyText :value="item.title" />
            </a>
          </nav>
          <span class="navigation-divider" aria-hidden="true"></span>
          <span id="social-navigation-label" class="visually-hidden" lang="en">Social links</span>
          <nav class="social-navigation" aria-labelledby="social-navigation-label" lang="en">
            <a :href="config.github" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a :href="config.x" target="_blank" rel="noopener noreferrer">X</a>
          </nav>
        </div>
      </div>
      <ColorModeToggle />
    </div>
  </header>
</template>