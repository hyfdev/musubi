<script setup lang="ts">
import type { SiteConfig } from '../lib/site/types.ts'

const props = defineProps<{
  config: SiteConfig
}>()

const currentYear = new Date().getFullYear()
const yearRange =
  props.config.since < currentYear ? `${props.config.since}–${currentYear}` : String(currentYear)
</script>

<template>
  <footer class="site-footer">
    <div class="shell site-footer-inner">
      <p>
        © {{ yearRange }} <a :href="config.link">{{ config.author }}</a>
      </p>
      <p>Written in Notion, typeset by Musubi.</p>
    </div>
  </footer>
</template>