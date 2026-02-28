<script setup lang="ts">
import Navbar from './Navbar.vue'
import Footer from './Footer.vue'
import type { SharedData } from '../server/website/getSharedData'

defineProps<{
  shared: SharedData
}>()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
    <Navbar :content-pages="shared.contentPages" :social-link="shared.socialLink" />
    <main class="flex-1 w-full max-w-[var(--site-width)] mx-auto px-4 sm:px-6">
      <slot />
    </main>
    <Footer :author="shared.author" :since="shared.since" />
  </div>
</template>
