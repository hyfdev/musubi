<script setup lang="ts">
import { useRouter } from '@void/vue'
import type { NavigationItem, SiteConfig } from '#shared/site/types'
import ColorModeToggle from './ColorModeToggle.vue'
import TypographyText from './TypographyText.vue'

defineProps<{
  config: SiteConfig
  navigation: NavigationItem[]
}>()

const router = useRouter()

function isCurrent(target: string): boolean {
  if (target === '/') return router.path === '/'
  if (target === '/blog') return router.path === '/blog' || router.path.startsWith('/blog/')
  return router.path === target
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
          <span
            v-if="config.github || config.x"
            class="navigation-divider"
            aria-hidden="true"
          ></span>
          <span
            v-if="config.github || config.x"
            id="social-navigation-label"
            class="visually-hidden"
            lang="en"
            >Social links</span
          >
          <nav
            v-if="config.github || config.x"
            class="social-navigation"
            aria-labelledby="social-navigation-label"
            lang="en"
          >
            <a v-if="config.github" :href="config.github" target="_blank" rel="noopener noreferrer"
              >GitHub</a
            >
            <a v-if="config.x" :href="config.x" target="_blank" rel="noopener noreferrer">X</a>
          </nav>
        </div>
      </div>
      <ColorModeToggle />
    </div>
  </header>
</template>