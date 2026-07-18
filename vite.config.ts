import { defineConfig } from 'vite-plus'

export default defineConfig({
  fmt: {
    tabWidth: 2,
    useTabs: false,
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    endOfLine: 'lf',
    ignorePatterns: ['.snapshot', '.musubi/notion-data-snapshot', 'AGENTS.md', 'CLAUDE.md'],
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
      // Keep Vue-aware type checking behind the dedicated Nuxt task.
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
        command: ['vp lint', 'designmd lint DESIGN.md'],
        cache: false,
      },
      typecheck: {
        command: 'vp run nuxt:typecheck',
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
      'check:build': {
        command: [
          'vp run brand:check',
          'vp run font:build',
          'vp run nuxt:generate',
          'vp run static:finalize',
          'vp run artifact',
        ],
        cache: false,
      },
      artifact: {
        command: 'node scripts/verify-static-artifact.mjs',
        cache: false,
      },
      ready: {
        command: [
          'vp run format',
          'vp run lint',
          'vp run typecheck',
          'vp run test',
          'vp run brand:verify',
          'vp run check:build',
        ],
        cache: false,
      },
    },
  },
})