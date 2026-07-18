<script setup lang="ts">
import { createError, useFetch, useHead } from '#imports'
import { provide } from 'vue'
import Footer from './components/Footer.vue'
import Navbar from './components/Navbar.vue'
import { siteLinkKey } from './lib/site/link.ts'

const { data, error } = await useFetch('/api/build/shell', { key: 'musubi-site-shell' })
if (error.value || !data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'The prepared site shell could not be loaded',
    cause: error.value,
  })
}

const shell = data.value
provide(siteLinkKey, shell.config.link)
const interactionScript = `(() => {
  const storageKey = 'musubi-theme';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const choices = ['light', 'dark', 'system'];
  const readChoice = () => {
    try {
      const value = localStorage.getItem(storageKey) || 'system';
      return choices.includes(value) ? value : 'system';
    } catch {
      return 'system';
    }
  };
  const resolvedTheme = (choice) => choice === 'system' ? (media.matches ? 'dark' : 'light') : choice;
  const updateThemeControl = (choice, systemResolved) => {
    const switcher = document.querySelector('.theme-switcher');
    if (!switcher) return;
    for (const button of switcher.querySelectorAll('.theme-option[value]')) {
      const buttonChoice = button.value || 'system';
      const selected = buttonChoice === choice;
      const name = buttonChoice === 'system'
        ? 'System (' + systemResolved + ')'
        : buttonChoice[0].toUpperCase() + buttonChoice.slice(1);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', buttonChoice === 'system'
        ? 'Use system theme (currently ' + systemResolved + ')'
        : 'Use ' + buttonChoice + ' theme');
      button.setAttribute('title', name);
    }
  };
  const applyTheme = (choice, persist = false) => {
    const resolved = resolvedTheme(choice);
    root.dataset.theme = resolved;
    root.dataset.themeChoice = choice;
    root.style.colorScheme = resolved;
    updateThemeControl(choice, resolvedTheme('system'));
    if (persist) {
      try { localStorage.setItem(storageKey, choice); } catch {}
    }
  };
  applyTheme(readChoice());

  const copyText = async (value) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('Copy command failed');
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(readChoice());

    const navViewport = document.querySelector('.site-center-viewport');
    const activeNav = navViewport?.querySelector('[aria-current="page"]');
    if (activeNav) activeNav.scrollIntoView({ block: 'nearest', inline: 'center' });
    let navFramePending = false;
    const updateNavCues = () => {
      if (!navViewport) return;
      const maximum = Math.max(navViewport.scrollWidth - navViewport.clientWidth, 0);
      navViewport.classList.toggle('can-scroll-left', maximum > 1 && navViewport.scrollLeft > 1);
      navViewport.classList.toggle('can-scroll-right', maximum > 1 && navViewport.scrollLeft < maximum - 1);
      navFramePending = false;
    };
    const scheduleNavCueUpdate = () => {
      if (navFramePending) return;
      navFramePending = true;
      requestAnimationFrame(updateNavCues);
    };
    navViewport?.addEventListener('scroll', scheduleNavCueUpdate, { passive: true });
    window.addEventListener('resize', scheduleNavCueUpdate, { passive: true });
    scheduleNavCueUpdate();

    const header = document.querySelector('.site-header');
    let previousY = window.scrollY;
    let framePending = false;
    const updateHeader = () => {
      const currentY = Math.max(window.scrollY, 0);
      if (header) {
        if (currentY <= 4 || currentY < previousY) header.classList.remove('is-hidden');
        else if (currentY > previousY && currentY > 60) header.classList.add('is-hidden');
      }
      previousY = currentY;
      framePending = false;
    };
    window.addEventListener('scroll', () => {
      if (!framePending) {
        framePending = true;
        requestAnimationFrame(updateHeader);
      }
    }, { passive: true });
    header?.addEventListener('focusin', () => header.classList.remove('is-hidden'));

    document.addEventListener('click', async (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const themeButton = target?.closest('.theme-option[value]');
      if (themeButton && choices.includes(themeButton.value)) {
        applyTheme(themeButton.value, true);
        return;
      }

      const copyButton = target?.closest('.code-copy');
      if (!copyButton) return;
      const block = copyButton.closest('.code-block');
      const code = block?.querySelector('.code-scroll code');
      const label = copyButton.querySelector('.code-copy-label');
      if (!code || !label) return;
      try {
        await copyText(code.textContent || '');
        label.textContent = 'Copied';
        copyButton.dataset.copyState = 'success';
      } catch {
        label.textContent = 'Copy failed';
        copyButton.dataset.copyState = 'error';
      }
      window.setTimeout(() => {
        label.textContent = 'Copy';
        delete copyButton.dataset.copyState;
      }, 1800);
    });
  });

  media.addEventListener('change', () => applyTheme(readChoice()));
})();`

useHead({
  htmlAttrs: { lang: shell.config.lang },
  titleTemplate: (title) =>
    !title || title === shell.config.title
      ? shell.config.title
      : `${title} — ${shell.config.title}`,
  meta: [{ name: 'description', content: shell.config.description }],
  script: [{ key: 'musubi-interactions', innerHTML: interactionScript }],
})
</script>

<template>
  <a class="skip-link" href="#main-content" lang="en">Skip to content</a>
  <div class="site-frame">
    <Navbar :config="shell.config" :navigation="shell.navigation" />
    <main id="main-content" class="site-main">
      <NuxtPage />
    </main>
    <Footer :config="shell.config" />
  </div>
</template>