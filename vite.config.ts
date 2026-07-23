import { fileURLToPath } from 'node:url'

import { voidVue } from '@void/vue/plugin'
import UnoCSS from 'unocss/vite'
import { defineConfig, type UserConfig } from 'vite-plus'
import { voidPlugin } from 'void'

const fontSetup = 'node --env-file-if-exists=.env.local scripts/font/index.ts'
const notionSetup = 'node --env-file-if-exists=.env.local scripts/notion/index.ts'

const config = {
  // Vite+ exposes its fork's Plugin type, while Void and UnoCSS publish against Vite's public
  // Plugin type. Keep that package-type mismatch at this boundary; dev and build verify runtime
  // compatibility, while `satisfies UserConfig` still checks every other configuration field.
  plugins: [...voidPlugin(), ...voidVue(), ...UnoCSS()] as UserConfig['plugins'],
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
  fmt: {
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    endOfLine: 'lf',
    ignorePatterns: [
      '.snapshot',
      '.musubi/notion-data-snapshot',
      'scripts/font/fallback-hot-shards.json',
      'scripts/font/prebuilt-fallback/fonts-manifest.json',
      'AGENTS.md',
      'CLAUDE.md',
    ],
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: {
      'typescript/no-explicit-any': 'warn',
      'typescript/no-unused-vars': 'warn',
      'import/no-cycle': 'warn',
      'unicorn/no-null': 'off',
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    env: {
      browser: true,
      node: true,
      es2021: true,
    },
    options: {
      typeAware: true,
      // Keep Vue-aware type checking behind the dedicated Void task.
      typeCheck: false,
    },
  },
  staged: {
    '*': 'vp check --fix',
  },
  run: {
    cache: false,
    tasks: {
      format: {
        command: 'vp fmt --check',
        cache: false,
      },
      lint: {
        command: ['vp lint', 'designmd lint .agents/docs/DESIGN.md'],
        cache: false,
      },
      typecheck: {
        command: ['vp run void:typecheck', 'vp run tooling:typecheck'],
        cache: false,
      },
      test: {
        command: 'vp test run',
        cache: false,
      },
      'brand:verify': {
        command: 'node scripts/verify-brand-color.ts',
        cache: false,
      },
      'brand:check': {
        command: [
          'node scripts/verify-brand-color.ts --quick',
          'node scripts/update-brand-color.ts --check',
        ],
        cache: false,
      },
      'brand:update': {
        command: ['vp run brand:verify', 'node scripts/update-brand-color.ts --write'],
        cache: false,
      },
      'notion:setup': {
        command: notionSetup,
        cache: false,
      },
      'font:setup': {
        command: fontSetup,
        cache: false,
      },
      'font:build': {
        command: 'node scripts/font/build.ts',
        cache: false,
      },
      'void:dev': {
        command: 'vp dev',
        cache: false,
      },
      'void:typecheck': {
        command: ['void prepare', 'vue-tsc --noEmit'],
        cache: false,
      },
      'tooling:typecheck': {
        command: 'tsc --noEmit -p tsconfig.tooling.json',
        cache: false,
      },
      'void:build': {
        command: 'vp build',
        cache: false,
      },
      'static:finalize': {
        command: 'node scripts/finalize-static-artifact.mjs',
        cache: false,
      },
      'static:serve': {
        command: 'node scripts/serve-static.mjs',
        cache: false,
      },
      artifact: {
        command: 'node scripts/verify-static-artifact.mjs',
        cache: false,
      },
      // Offline static site from the on-disk Notion snapshot (no Notion network).
      'site:build': {
        command: [
          'vp run brand:check',
          'vp run font:setup',
          'vp run font:build',
          'vp run void:build',
          'vp run static:finalize',
          'vp run artifact',
        ],
        cache: false,
      },
      ready: {
        command: [
          'vp run format',
          'vp run lint',
          'vp run typecheck',
          'vp run test',
          'vp run brand:verify',
          'vp run site:build',
        ],
        cache: false,
      },
    },
  },
} satisfies UserConfig

export default defineConfig(config)