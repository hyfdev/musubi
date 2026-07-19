import { loadSiteFromSnapshot } from './server/site/get-site.ts'

const prerenderRoutes = [...(await loadSiteFromSnapshot()).routes, '/__musubi_not_found']

export default defineNuxtConfig({
  compatibilityDate: '2026-07-12',
  modules: ['@unocss/nuxt'],
  css: ['./app/assets/css/main.css'],
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
    typeCheck: true,
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
        { rel: 'stylesheet', href: '/_musubi/generated/fonts/fonts.css' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'color-scheme', content: 'light dark' },
      ],
    },
  },
})