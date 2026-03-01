<script setup lang="ts">
import { ref } from 'vue'
import ColorModeToggle from './ColorModeToggle.vue'
import MdiGithub from '~icons/mdi/github'
import MdiTwitter from '~icons/mdi/twitter'
import MdiMenu from '~icons/mdi/menu'
import MdiClose from '~icons/mdi/close'

defineProps<{
  contentPages: Array<{ title: string; slug: string }>
  socialLink?: { github?: string; x?: string }
}>()

const mobileMenuOpen = ref(false)
</script>

<template>
  <header class="py-5">
    <div class="max-w-[var(--site-width)] mx-auto px-4 sm:px-6 flex items-center justify-between">
      <a
        href="/"
        class="text-[17px] font-[var(--font-display)] font-semibold tracking-[-0.01em] text-[var(--color-text)] no-underline hover:no-underline"
      >
        musubi
      </a>

      <!-- Desktop nav -->
      <nav class="hidden sm:flex items-center gap-6">
        <a
          v-for="page in contentPages"
          :key="page.slug"
          :href="`/${page.slug}`"
          class="text-[13px] font-medium tracking-wide uppercase text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors no-underline"
        >
          {{ page.title }}
        </a>
        <a
          href="/tags"
          class="text-[13px] font-medium tracking-wide uppercase text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors no-underline"
        >
          Tags
        </a>

        <span class="w-px h-4 bg-[var(--color-border)]" />

        <a
          v-if="socialLink?.github"
          :href="socialLink.github"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
          title="GitHub"
        >
          <MdiGithub class="w-[18px] h-[18px]" />
        </a>
        <a
          v-if="socialLink?.x"
          :href="socialLink.x"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
          title="Twitter/X"
        >
          <MdiTwitter class="w-[18px] h-[18px]" />
        </a>
        <ColorModeToggle />
      </nav>

      <!-- Mobile toggle -->
      <button
        class="sm:hidden cursor-pointer p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
        aria-label="Toggle menu"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <MdiClose v-if="mobileMenuOpen" class="w-5 h-5" />
        <MdiMenu v-else class="w-5 h-5" />
      </button>
    </div>

    <!-- Mobile menu -->
    <nav
      v-if="mobileMenuOpen"
      class="sm:hidden mt-3 mx-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-[0_2px_12px_var(--color-shadow)] flex flex-col gap-3"
    >
      <a
        v-for="page in contentPages"
        :key="page.slug"
        :href="`/${page.slug}`"
        class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] no-underline transition-colors"
      >
        {{ page.title }}
      </a>
      <a
        href="/tags"
        class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] no-underline transition-colors"
      >
        Tags
      </a>
      <div class="flex items-center gap-4 pt-2 mt-1 border-t border-[var(--color-border)]">
        <a
          v-if="socialLink?.github"
          :href="socialLink.github"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
          title="GitHub"
        >
          <MdiGithub class="w-[18px] h-[18px]" />
        </a>
        <a
          v-if="socialLink?.x"
          :href="socialLink.x"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
          title="Twitter/X"
        >
          <MdiTwitter class="w-[18px] h-[18px]" />
        </a>
        <ColorModeToggle />
      </div>
    </nav>
  </header>
</template>
