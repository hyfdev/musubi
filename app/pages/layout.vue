<script setup lang="ts">
import 'virtual:uno.css'
import '../assets/css/main.css'

import { useShared } from '@void/vue'
import { provide } from 'vue'
import Footer from '../components/Footer.vue'
import Navbar from '../components/Navbar.vue'
import { siteLinkKey } from '../lib/site/link.ts'

const shell = useShared()
provide(siteLinkKey, shell.config.link)
</script>

<template>
  <a class="skip-link" href="#main-content" lang="en">Skip to content</a>
  <div class="site-frame">
    <Navbar :config="shell.config" :navigation="shell.navigation" />
    <main id="main-content" class="site-main">
      <slot />
    </main>
    <Footer :config="shell.config" />
  </div>
</template>