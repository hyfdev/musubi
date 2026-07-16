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
  const currentTheme = () => root.dataset.theme === 'dark' ? 'dark' : 'light';
  const xWidgetsReadyEvent = 'musubi:x-widgets-ready';
  let xWidgetsPromise;
  const currentXWidgets = () => typeof window.twttr?.widgets?.createTweet === 'function'
    ? window.twttr.widgets
    : null;
  const loadXWidgets = () => {
    const readyWidgets = currentXWidgets();
    if (readyWidgets) return Promise.resolve(readyWidgets);
    if (xWidgetsPromise) return xWidgetsPromise;

    xWidgetsPromise = new Promise((resolve) => {
      let settled = false;
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        finish(null);
      }, 10000);
      const finish = (widgets) => {
        if (settled) {
          if (timedOut && widgets) document.dispatchEvent(new Event(xWidgetsReadyEvent));
          return;
        }
        settled = true;
        window.clearTimeout(timeout);
        if (!widgets) xWidgetsPromise = null;
        resolve(widgets || null);
      };
      const waitForReady = () => {
        const widgets = currentXWidgets();
        if (widgets) {
          finish(widgets);
          return;
        }
        const runtime = window.twttr;
        if (typeof runtime?.ready === 'function') {
          runtime.ready((readyRuntime) => finish(readyRuntime?.widgets || currentXWidgets()));
        }
      };

      let script = document.querySelector('script[data-musubi-x-widgets]');
      if (!script) {
        script = document.createElement('script');
        script.async = true;
        script.src = 'https://platform.x.com/widgets.js';
        script.dataset.musubiXWidgets = '';
        document.head.append(script);
      }
      script.addEventListener('load', waitForReady, { once: true });
      script.addEventListener('error', () => {
        script.remove();
        finish(null);
      }, { once: true });
      waitForReady();
    });
    return xWidgetsPromise;
  };
  const renderXEmbeds = async (theme) => {
    const embeds = [...document.querySelectorAll('.x-embed')];
    if (!embeds.length) return;
    const widgets = await loadXWidgets();
    if (!widgets?.createTweet) return;

    for (const embed of embeds) {
      const slot = embed.querySelector(':scope > .x-embed-widget:not(.x-embed-widget-staging)');
      const pendingSlot = embed.querySelector(':scope > .x-embed-widget-staging');
      const fallback = embed.querySelector('.x-embed-fallback');
      const postUrl = fallback?.getAttribute('cite');
      let postId = null;
      try {
        postId = postUrl ? new URL(postUrl).pathname.match(/\\/status\\/([1-9]\\d*)\\/?$/)?.[1] : null;
      } catch {}
      if (!postId || !slot || !fallback) continue;
      const hasCurrentWidget = Boolean(slot.querySelector('iframe'));
      if (embed.dataset.xRenderedTheme === theme && hasCurrentWidget) {
        if (embed.dataset.xPendingTheme && embed.dataset.xPendingTheme !== theme) {
          embed.dataset.xRenderToken = String(Number(embed.dataset.xRenderToken || 0) + 1);
          pendingSlot?.remove();
          delete embed.dataset.xPendingTheme;
        }
        continue;
      }
      if (embed.dataset.xPendingTheme === theme) continue;

      const renderToken = String(Number(embed.dataset.xRenderToken || 0) + 1);
      embed.dataset.xRenderToken = renderToken;
      pendingSlot?.remove();
      const nextSlot = document.createElement('div');
      nextSlot.className = 'x-embed-widget x-embed-widget-staging';
      nextSlot.setAttribute('aria-hidden', 'true');
      embed.dataset.xPendingTheme = theme;
      embed.append(nextSlot);
      let renderTimeout;
      try {
        const rendered = await Promise.race([
          widgets.createTweet(postId, nextSlot, {
            align: 'center',
            conversation: 'none',
            dnt: true,
            theme,
          }),
          new Promise((resolve) => {
            renderTimeout = window.setTimeout(() => resolve(null), 10000);
          }),
        ]);
        if (!embed.isConnected || embed.dataset.xRenderToken !== renderToken) {
          rendered?.remove();
          nextSlot.remove();
          continue;
        }
        if (!rendered) throw new Error('X widget did not render');
        nextSlot.classList.remove('x-embed-widget-staging');
        nextSlot.removeAttribute('aria-hidden');
        slot.replaceWith(nextSlot);
        fallback.hidden = true;
        embed.dataset.xRenderedTheme = theme;
        delete embed.dataset.xPendingTheme;
      } catch {
        if (!embed.isConnected || embed.dataset.xRenderToken !== renderToken) continue;
        nextSlot.remove();
        delete embed.dataset.xPendingTheme;
        fallback.hidden = Boolean(slot.querySelector('iframe'));
      } finally {
        window.clearTimeout(renderTimeout);
      }
    }
  };
  document.addEventListener('musubi:x-embed-mounted', () => void renderXEmbeds(currentTheme()));
  document.addEventListener(xWidgetsReadyEvent, () => void renderXEmbeds(currentTheme()));
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
    if (document.readyState !== 'loading') void renderXEmbeds(resolved);
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