<script setup lang="ts">
import { ref } from 'vue'
import { ClientOnly } from '#components'
import { useNavbarData } from '~/composables/useNavbarData'
import ColorModeToggle from '~/components/ColorModeToggle.vue'
import MdiGithub from '~icons/mdi/github'
import MdiTwitter from '~icons/mdi/twitter'
import MdiMenu from '~icons/mdi/menu'
import MdiClose from '~icons/mdi/close'

const navbarData = await useNavbarData()

const mobileMenuOpen = ref(false)
</script>

<template>
  <header class="py-6">
    <div class="max-w-[var(--site-width)] mx-auto px-4 sm:px-6 flex items-center justify-between">
      <a
        href="/"
        class="text-lg font-bold text-[var(--color-text)] no-underline hover:no-underline"
      >
        Musubi
      </a>

      <!-- Desktop nav -->
      <nav class="hidden sm:flex items-center gap-5">
        <a
          v-for="page in navbarData.contentPages"
          :key="page.slug"
          :href="`/${page.slug}`"
          class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors no-underline"
        >
          {{ page.title }}
        </a>
        <a
          href="/tags"
          class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors no-underline"
        >
          Tags
        </a>
        <a
          v-if="navbarData.social?.github"
          :href="navbarData.social.github"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
          title="GitHub"
        >
          <MdiGithub class="w-5 h-5" />
        </a>
        <a
          v-if="navbarData.social?.x"
          :href="navbarData.social.x"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
          title="Twitter/X"
        >
          <MdiTwitter class="w-5 h-5" />
        </a>
        <ClientOnly>
          <ColorModeToggle />
          <template #fallback>
            <div class="w-[34px] h-[34px]" />
          </template>
        </ClientOnly>
      </nav>

      <!-- Mobile toggle -->
      <button
        class="sm:hidden cursor-pointer p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
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
      class="sm:hidden mt-4 px-4 pb-4 border-b border-[var(--color-border)] flex flex-col gap-3"
    >
      <a
        v-for="page in navbarData.contentPages"
        :key="page.slug"
        :href="`/${page.slug}`"
        class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] no-underline"
      >
        {{ page.title }}
      </a>
      <a
        href="/tags"
        class="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] no-underline"
      >
        Tags
      </a>
      <div class="flex items-center gap-4 pt-2">
        <a
          v-if="navbarData.social?.github"
          :href="navbarData.social.github"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
          title="GitHub"
        >
          <MdiGithub class="w-5 h-5" />
        </a>
        <a
          v-if="navbarData.social?.x"
          :href="navbarData.social.x"
          target="_blank"
          rel="noopener noreferrer"
          class="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] transition-colors"
          title="Twitter/X"
        >
          <MdiTwitter class="w-5 h-5" />
        </a>
        <ClientOnly>
          <ColorModeToggle />
          <template #fallback>
            <div class="w-[34px] h-[34px]" />
          </template>
        </ClientOnly>
      </div>
    </nav>
  </header>
</template>
