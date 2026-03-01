<script setup lang="ts">
import { useCycleList, useColorMode } from '@vueuse/core'
import { watchEffect } from 'vue'
import MdiWeatherSunny from '~icons/mdi/weather-sunny'
import MdiWeatherNight from '~icons/mdi/weather-night'
import MdiSunMoonStars from '~icons/mdi/theme-light-dark'

const mode = useColorMode()

const { state, next } = useCycleList(['auto', 'light', 'dark'] as const, {
  initialValue: mode.store.value as 'auto' | 'light' | 'dark',
})

watchEffect(() => {
  mode.store.value = state.value
})
</script>

<template>
  <button
    class="cursor-pointer flex items-center justify-center p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors focus:outline-none"
    :title="`Color mode: ${state}`"
    aria-label="Toggle color mode"
    @click="next()"
  >
    <MdiWeatherSunny v-if="state === 'light'" class="w-[17px] h-[17px]" />
    <MdiWeatherNight v-else-if="state === 'dark'" class="w-[17px] h-[17px]" />
    <MdiSunMoonStars v-else class="w-[17px] h-[17px]" />
  </button>
</template>
