<script setup lang="ts">
import { createError, useFetch, useHead } from '#imports'
import Footer from './components/Footer.vue'
import Navbar from './components/Navbar.vue'

const { data, error } = await useFetch('/api/build/shell', { key: 'musubi-site-shell' })
if (error.value || !data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'The prepared site shell could not be loaded',
    cause: error.value,
  })
}

const shell = data.value
const themeScript = `(() => {
  const key = 'musubi-theme';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const choices = new Set(['system', 'light', 'dark']);
  const read = () => { try { const value = localStorage.getItem(key) || 'system'; return choices.has(value) ? value : 'system'; } catch { return 'system'; } };
  const apply = (choice, persist = false) => {
    const theme = choice === 'system' ? (media.matches ? 'dark' : 'light') : choice;
    root.dataset.theme = theme;
    root.dataset.themeChoice = choice;
    root.style.colorScheme = theme;
    document.querySelectorAll('button[name="musubi-theme"]').forEach((button) => button.setAttribute('aria-pressed', String(button.value === choice)));
    if (persist) { try { localStorage.setItem(key, choice); } catch {} }
  };
  apply(read());
  document.addEventListener('DOMContentLoaded', () => {
    apply(read());
    document.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('button[name="musubi-theme"]') : null;
      if (button && choices.has(button.value)) apply(button.value, true);
    });
  });
  media.addEventListener('change', () => { if (read() === 'system') apply('system'); });
})();`

useHead({
  htmlAttrs: { lang: shell.config.lang },
  titleTemplate: (title) =>
    !title || title === shell.config.title
      ? shell.config.title
      : `${title} — ${shell.config.title}`,
  meta: [{ name: 'description', content: shell.config.description }],
  script: [{ key: 'musubi-theme', innerHTML: themeScript }],
})
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="site-frame">
    <Navbar :config="shell.config" :navigation="shell.navigation" />
    <main id="main-content" class="site-main">
      <NuxtPage />
    </main>
    <Footer :config="shell.config" />
  </div>
</template>