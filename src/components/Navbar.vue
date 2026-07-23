<script setup lang="ts">
import { Link, useRouter } from '@void/vue'
import { nextTick, ref, watch } from 'vue'
import type { NavigationItem, SiteConfig } from '#shared/site/types'
import ColorModeToggle from './ColorModeToggle.vue'
import TypographyText from './TypographyText.vue'

defineProps<{
  config: SiteConfig
  navigation: NavigationItem[]
}>()

const router = useRouter()
const navigationViewport = ref<HTMLElement>()

function isCurrent(target: string): boolean {
  if (target === '/') return router.path === '/'
  if (target === '/blog') return router.path === '/blog' || router.path.startsWith('/blog/')
  return router.path === target
}

watch(
  () => router.path,
  async () => {
    await nextTick()

    const viewport = navigationViewport.value
    const activeLink = viewport?.querySelector<HTMLElement>('[aria-current="page"]')
    activeLink?.scrollIntoView({ block: 'nearest', inline: 'center' })

    requestAnimationFrame(() => {
      if (!viewport) return
      const maximum = Math.max(viewport.scrollWidth - viewport.clientWidth, 0)
      viewport.classList.toggle('can-scroll-left', maximum > 1 && viewport.scrollLeft > 1)
      viewport.classList.toggle(
        'can-scroll-right',
        maximum > 1 && viewport.scrollLeft < maximum - 1,
      )
    })
  },
)
</script>

<template>
  <header class="site-header">
    <div class="shell site-header-inner">
      <Link class="site-brand" href="/"><TypographyText :value="config.title" /></Link>
      <div ref="navigationViewport" class="site-center-viewport">
        <div class="site-center">
          <span id="primary-navigation-label" class="visually-hidden" lang="en"
            >Primary navigation</span
          >
          <nav class="site-navigation" aria-labelledby="primary-navigation-label">
            <Link href="/" :aria-current="isCurrent('/') ? 'page' : undefined" lang="en">Home</Link>
            <Link href="/blog" :aria-current="isCurrent('/blog') ? 'page' : undefined" lang="en"
              >Blog</Link
            >
            <Link
              v-for="item in navigation"
              :key="item.route"
              :href="item.route"
              :aria-current="isCurrent(item.route) ? 'page' : undefined"
            >
              <TypographyText :value="item.title" />
            </Link>
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