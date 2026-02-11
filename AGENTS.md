# Agent Guidelines for Musubi

## Build & Development Commands

- **Install**: `pnpm install` (required package manager)
- **Dev**: `pnpm dev` (starts server on localhost:3000, uses snapshots by default)
- **Dev (remote)**: `pnpm dev:live` (starts server fetching live from Notion)
- **Build**: `pnpm build` (static site generation, fetches live data from Notion)
- **Preview**: `pnpm preview` (preview production build)
- **Snapshot update**: `pnpm snapshot:update` (refreshes snapshots from Notion)

## Snapshots

Snapshots are committed, point-in-time copies of Notion data stored in `.snapshot/`. They allow `pnpm dev` and `pnpm check:build` to run without hitting the Notion API.

- `pnpm dev` uses snapshots by default for fast iteration
- `pnpm dev:live` bypasses snapshots and fetches live from Notion
- `pnpm snapshot:update` refreshes snapshots from Notion (requires API credentials)
- `pnpm build` fetches live data from Notion (does NOT use snapshots)
- After adding/changing content in Notion, run `pnpm snapshot:update` to pick up changes locally

## Code Style

- **Indentation**: 2 spaces (see .editorconfig)
- **TypeScript**: Enabled, use TypeScript for all new files
- **Imports**: Nuxt auto-imports components, composables, and Vue APIs - no manual imports needed for framework features
- **Components**: Place in `app/components/` for auto-import
- **Naming**: PascalCase for components (e.g., `Navbar.vue`), camelCase for composables

## Framework Conventions

- **Structure**:
  - Use `app/` directory for components, assets, pages, composables
  - Use `app/server/` directory for server-only code (Notion API, database clients)
  - Server code must be imported dynamically inside `usePrerenderData` handlers (see pitfalls below)
- **Styling**: TailwindCSS v4 with `@tailwindcss/vite` plugin - use utility classes
- **Config**: Main config in `nuxt.config.ts` using `defineNuxtConfig()`
- **Routes**: Auto-generated from `app/pages/`

## Verification

MANDATORY: Always run verification commands after making changes.

- **Type Checking**: `pnpm check:types` (checks type errors with vue-tsc)
- **Linting**: `pnpm check:lint` (checks linting issues with oxlint)
- **Format Check**: `pnpm check:format` (checks formatting with oxfmt)
- **Build**: `pnpm check:build` (verifies build with snapshots)

To auto-fix issues:

- **Fix Lint**: `pnpm fix:lint` (auto-fix linting issues)
- **Fix Format**: `pnpm fix:format` (auto-format code)

**Tip**: Use Bash sub-agents to run commands in parallel for faster verification.

# Common Pitfalls & Best Practices

- **Always use `<a>` instead of `<NuxtLink>` for internal links:** Musubi is a statically generated site where all blog data is fetched at build time during prerendering. Using `<NuxtLink>` enables client-side routing, which bypasses the prerendered HTML and attempts to fetch data at runtime (which won't work since there's no server API). Standard `<a>` tags ensure users receive the fully prerendered pages.

- **Vue SFC block order - `<script>` first pattern:** Always organize Vue Single File Components with the following block order: `<script setup lang="ts">` → `<template>` → `<style>` (if present). This improves readability by presenting the component's logic and data flow before its presentation layer. Template-only components (without script blocks) should remain as-is.

- **Centralize all `useAsyncData` keys in `keysForUseAsyncData.ts`:** With `sharedPrerenderData: true` in `nuxt.config.ts`, Nuxt shares async data across prerendered pages. Without an explicit key, `useAsyncData` generates a key based on file path, causing data collision when the same composable is called for different pages.

  **Rules:**
  - All keys MUST be defined in `app/utils/keysForUseAsyncData.ts`
  - Never define keys inline in composables
  - Use constants for static keys (e.g., `NAVBAR_DATA_KEY`)
  - Use factory functions for dynamic keys (e.g., `createPostPageDataKey(slug)`)

  ```typescript
  // ❌ Bad - key defined inline
  const KEY = 'my-data'
  usePrerenderData(KEY, ...)

  // ✅ Good - key imported from centralized file
  import { MY_DATA_KEY } from '~/utils/keysForUseAsyncData'
  usePrerenderData(MY_DATA_KEY, ...)
  ```

- **Minimize data returned from `useAsyncData`:** The data returned from `useAsyncData` is serialized and injected into each page's HTML/payload, increasing page size. Only return the data actually needed for rendering - avoid returning entire objects when only a few fields are used.

- **Eliminating server-only code from client bundles:** Server-only code lives in `app/server/`. This project uses `nuxt-prerender-kit` to completely tree-shake server code from client bundles (not just move it to a separate chunk).

  **Pattern:** Use `usePrerenderData` from `nuxt-prerender-kit/runtime`:

  ```typescript
  // ❌ Bad - Server code bundled into client
  import { Website } from '~~/app/server/website/Website'

  useAsyncData('key', async () => {
    const website = Website.getInstance()
  })

  // ✅ Good - Server code completely tree-shaken from client bundle
  import { usePrerenderData } from 'nuxt-prerender-kit/runtime'

  usePrerenderData('key', async () => {
    const { Website } = await import('~~/app/server/website/Website')
    const website = Website.getInstance()
    return data
  })
  ```

  **How it works:**
  - `nuxt-prerender-kit` automatically wraps the handler with `import.meta.prerender ? handler : __neverReachable_prerender()` via a Vite plugin
  - No manual `import.meta.server` conditionals needed - the module handles this automatically
  - `usePrerenderData` returns data directly (not wrapped in AsyncData object) and throws descriptive errors if data fetch fails or returns null
  - **CRITICAL: Use dynamic `import()` inside the handler** - static imports at file top will still bundle server code:

    ```typescript
    // ❌ Bad - static import still bundles Website into client
    import { Website } from '~~/app/server/website/Website'

    usePrerenderData('key', async () => {
      Website.getInstance()  // Website already bundled!
    })

    // ✅ Good - dynamic import inside handler, completely eliminated
    usePrerenderData('key', async () => {
      const { Website } = await import('~~/app/server/website/Website')
      Website.getInstance()
    })
    ```

- **Move logic inside `usePrerenderData` when possible:** Logic inside `usePrerenderData` handlers is removed from the final client output. Move data transformations, filtering, and processing inside the handler rather than in component code to reduce bundle size.

- **Per-page data composables:** Each page/component should have its own dedicated composable that returns exactly what it needs - no more, no less. Avoid creating shared composables that return fields not used by all consumers.

  ```typescript
  // ❌ Bad - shared composable returns unused fields
  // useWebsiteData returns {postMetaList, contentPages} but most consumers only need one
  const data = await useWebsiteData()
  // Home page only uses postMetaList, but contentPages is also in payload

  // ✅ Good - dedicated composables return only what's needed
  // useHomePageData returns {websiteTitle, posts: [{title, slug, date}]}
  const homeData = await useHomePageData()
  // Only fields actually used are in payload

  // useNavbarData returns {contentPages: [{title, slug}], social}
  const navData = await useNavbarData()
  // Navbar only gets what it renders
  ```

  **Naming convention:**
  - Layout composables: `useNavbarData`, `useFooterData`
  - Page composables: `useHomePageData`, `usePostPageData`, `useContentPageData`

  **Benefits:**
  - Smaller payload per page (only needed fields serialized)
  - Clearer data flow (each consumer's needs are explicit)
  - Better tree-shaking of unused data transformations
