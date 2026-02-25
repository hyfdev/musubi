<script setup lang="ts">
import Navbar from '~/components/Navbar.vue'
import Footer from '~/components/Footer.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
    <NuxtRouteAnnouncer />
    <Navbar />
    <main class="flex-1 w-full max-w-[var(--site-width)] mx-auto px-4 sm:px-6">
      <NuxtPage />
    </main>
    <Footer />
  </div>
</template>
