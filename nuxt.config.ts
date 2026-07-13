import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface PreparedArtifactRoutes {
  schemaVersion: number
  routes: unknown
}

async function readPreparedRoutes(): Promise<string[]> {
  const artifactPath = resolve('.musubi/site.json')
  const source = await readFile(artifactPath, 'utf8').catch(() => undefined)
  if (!source) {
    return ['/']
  }

  const artifact = JSON.parse(source) as PreparedArtifactRoutes
  if (
    artifact.schemaVersion !== 1 ||
    !Array.isArray(artifact.routes) ||
    artifact.routes.some((route) => typeof route !== 'string' || !route.startsWith('/'))
  ) {
    throw new Error(`Prepared Musubi artifact has an invalid route manifest: ${artifactPath}`)
  }
  return artifact.routes as string[]
}

const prerenderRoutes = [...(await readPreparedRoutes()), '/__musubi_not_found']

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
  features: {
    noScripts: 'production',
  },
  experimental: {
    appManifest: false,
    payloadExtraction: false,
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