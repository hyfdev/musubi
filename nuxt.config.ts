import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { loadSiteFromSnapshot } from './server/site/get-site.ts'

const prerenderRoutes = [...(await loadSiteFromSnapshot()).routes, '/__musubi_not_found']
const generatedFontCss = (() => {
  try {
    return readdirSync(resolve('public/_musubi/generated/fonts'), { withFileTypes: true })
      .filter((entry) => entry.isFile() && /^fonts-[0-9a-f]{16}\.css$/u.test(entry.name))
      .map((entry) => entry.name)
      .sort()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
})()
const fontCssHref =
  generatedFontCss.length === 1
    ? `/_musubi/generated/fonts/${generatedFontCss[0]}`
    : '/_musubi/generated/fonts/fonts-unbuilt.css'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-12',
  modules: ['@unocss/nuxt'],
  // srcDir is app/; use ~ alias so virtual:nuxt:.nuxt/css.mjs resolves under Vite 8.
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  ssr: true,
  imports: {
    autoImport: false,
  },
  components: {
    dirs: [],
  },
  experimental: {
    // Inline payload in the first HTML response; emit `_payload.json` for client navigation.
    // This is Nuxt's recommended full-static shape and becomes the default with compatibilityVersion 5.
    payloadExtraction: 'client',
  },
  typescript: {
    strict: true,
    // 'build' only: dev + Vite 8 breaks vite-plugin-checker runtime under Nuxt base `/_nuxt/`.
    // Use `vp run typecheck` for day-to-day type checking.
    typeCheck: 'build',
    tsConfig: {
      compilerOptions: {
        allowImportingTsExtensions: true,
      },
      vueCompilerOptions: {
        strictTemplates: true,
      },
    },
    nodeTsConfig: {
      compilerOptions: {
        allowImportingTsExtensions: true,
      },
    },
    sharedTsConfig: {
      compilerOptions: {
        allowImportingTsExtensions: true,
      },
    },
  },
  nitro: {
    typescript: {
      tsConfig: {
        compilerOptions: {
          allowImportingTsExtensions: true,
        },
      },
    },
    prerender: {
      crawlLinks: false,
      routes: prerenderRoutes,
      failOnError: true,
    },
    routeRules: {
      '/api/build/**': { prerender: false },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en-SG' },
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'stylesheet', href: fontCssHref },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'color-scheme', content: 'light dark' },
      ],
    },
  },
})