<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const is404 = props.error.statusCode === 404

const title = is404 ? 'Page not found' : 'Something went wrong'
const message = is404
  ? "The page you're looking for doesn't exist or has been moved."
  : props.error.message || 'An unexpected error occurred.'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <p class="text-6xl font-bold text-[var(--color-text-tertiary)] mb-4">
        {{ error.statusCode }}
      </p>
      <h1 class="text-2xl font-bold text-[var(--color-text)] mb-2">{{ title }}</h1>
      <p class="text-[var(--color-text-secondary)] mb-8">{{ message }}</p>
      <a
        href="/"
        class="inline-block text-sm px-4 py-2 rounded-md bg-[var(--color-bg-subtle)] text-[var(--color-text)] no-underline hover:text-[var(--color-accent)] transition-colors"
      >
        Go back home
      </a>
    </div>
  </div>
</template>
