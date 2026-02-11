import { resolveWebsiteConfig } from './app/server/website/resolveWebsiteConfig'

const websiteConfig = await resolveWebsiteConfig()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@unocss/nuxt', 'unplugin-icons/nuxt', '@nuxtjs/color-mode', 'nuxt-prerender-kit'],
  imports: {
    autoImport: false,
  },
  components: {
    // Disable automatic component registration for clarity
    dirs: [],
  },
  devtools: { enabled: true },
  ssr: true,
  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      vueCompilerOptions: {
        // Ensure strict template type checking. Especially for detecting unknown components.
        strictTemplates: true,
      },
    },
    sharedTsConfig: {
      include: ['../website.config.ts'],
    },
  },
  css: ['./app/assets/css/main.css'],
  vite: {
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
    },
    ssr: {
      // `react-tweet` imports `index.module.css`, we need to bundle it to support usintg css modules in ssr
      noExternal: ['react-tweet'],
    },
    build: {
      rollupOptions: {
        external: ['node:fs'],
        onwarn(warning, defaultHandler) {
          // `react-tweet` uses `use client` which causes Rollup warning, we can safely ignore it
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
            return
          }
          // Suppress sourcemap warnings from `react-tweet`
          if (warning.message?.includes("Can't resolve original location of error")) {
            return
          }
          defaultHandler(warning)
        },
      },
    },
    environments: {
      ssr: {
        build: {
          rollupOptions: {
            onwarn(warning, defaultHandler) {
              // `react-tweet` uses `use client` which causes Rollup warning, we can safely ignore it
              if (
                warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
                warning.message.includes('use client')
              ) {
                return
              }
              defaultHandler(warning)
            },
          },
        },
      },
    },
  },
  nitro: {
    rollupConfig: {
      onwarn(warning, defaultHandler) {
        // Useless circular dependency warning from some dependencies
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          return
        }
        defaultHandler(warning)
      },
    },
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      failOnError: true,
    },
  },
  experimental: {
    // Caution:
    // - When enable `sharedPrerenderData`, must pass string key to `useAsyncData` to avoid data collision.
    // - When not passing string key to `useAsyncData`, nuxt will auto generate a key based on file path, which may cause data collision in some cases.
    // - https://github.com/nuxt/nuxt/blob/9094bb11213012bd6161fd8127984d08a5c588a3/packages/nuxt/src/core/plugins/keyed-functions.ts
    sharedPrerenderData: true,
  },
  app: {
    head: {
      title: websiteConfig.title, // default fallback title
      meta: [{ name: 'description', content: websiteConfig.description }],
    },
  },
})
