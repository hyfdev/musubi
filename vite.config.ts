import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { voidPlugin } from 'void'
import { voidVue } from '@void-x/vue'
import UnoCSS from 'unocss/vite'
import Icons from 'unplugin-icons/vite'

function snapshotPlugin(): Plugin {
  return {
    name: 'musubi:snapshots',
    resolveId: {
      filter: { id: /^virtual:snapshot-data$/ },
      handler(id) {
        return '\0' + id
      },
    },
    load: {
      // eslint-disable-next-line no-control-regex -- Vite virtual module \0 prefix
      filter: { id: /^\0virtual:snapshot-data$/ },
      handler() {
        if (process.env.VITE_USE_SNAPSHOT !== '1') {
          return 'export default {}'
        }
        const dir = resolve(process.cwd(), '.notion-data-snapshot')
        const store: Record<string, unknown> = {}
        for (const file of readdirSync(dir)) {
          if (file === 'manifest.json') {
            store.__manifest = JSON.parse(readFileSync(join(dir, file), 'utf-8'))
          } else if (file.endsWith('.json')) {
            const pageId = file.replace('.json', '')
            store[pageId] = JSON.parse(readFileSync(join(dir, file), 'utf-8'))
          }
        }
        return `export default ${JSON.stringify(store)}`
      },
    },
  }
}

export default defineConfig({
  plugins: [voidPlugin(), voidVue(), UnoCSS(), Icons({ compiler: 'vue3' }), snapshotPlugin()],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  ssr: {
    // `react-tweet` imports `index.module.css`, we need to bundle it to support using css modules in ssr
    noExternal: ['react-tweet'],
  },
  build: {
    rollupOptions: {
      output: {
        strictExecutionOrder: true,
      },
      onwarn(warning, handler) {
        // `react-tweet` uses `use client` which causes Rollup warning, we can safely ignore it
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
          return
        }
        // Suppress sourcemap warnings from `react-tweet`
        if (warning.message?.includes("Can't resolve original location of error")) {
          return
        }
        handler(warning)
      },
    },
  },
})
