# Agent Guidelines for Musubi

## Project Overview

Musubi is a **statically generated personal blog/website** powered by Nuxt that uses **Notion as a CMS**. Content is authored in Notion, fetched at build time via `notion-client`, and rendered as static HTML using `react-notion-x`. The site has no runtime server — all data is baked into the pages during prerendering.

## Build & Development Commands

- **Install**: `pnpm install` (required package manager)
- **Dev**: `pnpm dev` (starts server on localhost:3000, uses snapshots by default)
- **Dev (remote)**: `pnpm dev:live` (starts server fetching live from Notion)
- **Build**: `pnpm build` (static site generation, fetches live data from Notion)
- **Preview**: `pnpm preview` (preview production build)
- **Snapshot update**: `pnpm snapshot:update` (refreshes snapshots from Notion)

## Snapshots

Snapshots are committed, point-in-time copies of Notion data stored in `.snapshot/`. They allow `pnpm dev` and `pnpm check:build` to run without hitting the Notion API.

- `pnpm dev` uses snapshots by default for fast iteration (`USE_SNAPSHOT=1`)
- `pnpm dev:live` bypasses snapshots and fetches live from Notion
- `pnpm snapshot:update` refreshes snapshots from Notion (`UPDATE_SNAPSHOT=1`, requires API credentials)
- `pnpm build` fetches live data from Notion (does NOT use snapshots)
- `pnpm check:build` uses snapshots (`USE_SNAPSHOT=1`)
- After adding/changing content in Notion, run `pnpm snapshot:update` to pick up changes locally

**Snapshot internals:** `.snapshot/manifest.json` stores the database page ID. Each `{pageId}.json` file contains a `compress-json`-compressed `ExtendedRecordMap` from the Notion API. Logic lives in `app/server/notion/snapshot.ts`.

## Notion Integration Architecture

### Notion Page Structure

The root **"Musubi - Dashboard"** page (`2d0fe8dd-acd6-80a5-b773-c49f06baa29c`) contains three child databases:

1. **Config** (data source: `2d3fe8dd-acd6-804e-83ea-000bc910780c`) — Key-value store for site settings
   - Schema: `Name` (title), `Value` (text)
   - Entries: `title`, `description`, `author`, `social.github`, `social.x`
   - Supports dot notation for nesting (e.g., `seo.titleSuffix` → `config.seo.titleSuffix`)

2. **Published Pages** / **Database** — Two views of the **same** data source (`2d0fe8dd-acd6-81fb-8702-000b039af795`)
   - "Published Pages" is a filtered view (Status = Published)
   - "Database" shows all entries including drafts
   - Schema:
     | Property | Type | Details |
     |----------|------|---------|
     | Title | title | Page title |
     | Slug | text | URL path segment |
     | Date | date | Publication date |
     | Status | select | `Draft`, `Published` |
     | Type | select | `Post` (blog), `Content` (static page like About) |
     | Tags | multi_select | Topic tags |
     | Description | text | Description/excerpt |

### Server Code Architecture (`app/server/`)

```
app/server/
├── notion/
│   ├── NotionDatabasePage.ts    # Fetches database, extracts child page IDs
│   ├── NotionStandalonePage.ts  # Base class: fetches single page, property access
│   └── snapshot.ts              # Snapshot read/write with compress-json
├── musubi-notion/
│   ├── MusubiPage.ts            # Extends NotionStandalonePage: parses Title/Slug/Date/Status/Type/Tags
│   └── ConfigPage.ts            # Extends NotionDatabasePage: parses Name/Value pairs → config object
└── website/
    ├── Website.ts               # Singleton orchestrator: caches all pages, provides getters
    ├── resolveWebsiteConfig.ts  # Config from Notion (NOTION_CONFIG_PAGE_ID) or local fallback
    └── types/
        ├── PostMeta.ts          # {pageId, title, slug, date, description, tags}
        ├── WebsiteConfig.ts     # {title?, description?, author?, social?: {github?, x?}}
        └── types.ts             # Post = {meta: PostMeta, recordMap: ExtendedRecordMap}
```

**Key classes:**

- **`Website`** (singleton via `Website.getInstance()`) — Central data manager
  - Reads database page ID from snapshot manifest or `NOTION_DATABASE_PAGE_ID` env var
  - Creates `NotionDatabasePage` to list all child pages
  - Creates `MusubiPage` per child to extract metadata
  - Filters drafts, separates Posts from Content pages
  - Caches everything as promises for deduplication
  - Public API: `getPostMetaList()`, `getPostBySlug(slug)`, `getContentPages()`, `getContentPageBySlug(slug)`

- **`NotionDatabasePage`** — Fetches database recordMap, extracts child page IDs from `collection_query`

- **`NotionStandalonePage`** — Fetches individual page recordMap, provides typed property accessors (`getPropAsString`, `getPropAsDate`, `getPropAsTags`, etc.)

- **`MusubiPage`** — Validates and extracts blog metadata: Title, Slug, Date, Status (`Published`/`Draft`), Type (`Post`/`Content`), Tags, Description

- **`ConfigPage`** — Reads Name/Value rows from Config database, builds nested config object

- **`resolveWebsiteConfig()`** — Uses `NOTION_CONFIG_PAGE_ID` env var for remote config, falls back to local `website.config`

### Data Flow

```
Notion API (or .snapshot/)
  → NotionDatabasePage.fetchRecordMapCached() → child page IDs
  → MusubiPage(pageId) → {title, slug, date, status, type, tags}
  → Website filters/caches → PostMeta[] and Post objects
  → Composables (usePrerenderData) → minimal data for each consumer
  → Components render static HTML
```

## Frontend Architecture

### Routes

| Route          | Page File                   | Component         | Composable             |
| -------------- | --------------------------- | ----------------- | ---------------------- |
| `/`            | `app/pages/index.vue`       | (inline)          | `useHomePageData()`    |
| `/blog/[slug]` | `app/pages/blog/[slug].vue` | `PostPage.vue`    | `usePostPageData()`    |
| `/[slug]`      | `app/pages/[slug].vue`      | `ContentPage.vue` | `useContentPageData()` |

Layout components (`Navbar.vue`, `Footer.vue`) are rendered on every page via `app.vue`.

### Composables (`app/composables/`)

Each composable uses `usePrerenderData` with dynamic imports. Keys are centralized in `app/utils/keysForUseAsyncData.ts`.

| Composable             | Key                              | Returns                                        |
| ---------------------- | -------------------------------- | ---------------------------------------------- |
| `useHomePageData()`    | `HOME_PAGE_DATA_KEY`             | `{websiteTitle, posts: [{title, slug, date}]}` |
| `usePostPageData()`    | `createPostPageDataKey(slug)`    | `{websiteTitle, post: {meta, recordMap}}`      |
| `useContentPageData()` | `createContentPageDataKey(slug)` | `{websiteTitle, page: {meta, recordMap}}`      |
| `useNavbarData()`      | `NAVBAR_DATA_KEY`                | `{contentPages: [{title, slug}], social}`      |
| `useFooterData()`      | `FOOTER_DATA_KEY`                | `{author}`                                     |

### Components (`app/components/`)

- **`Navbar.vue`** — Site header: home link, content page links, social icons, color mode toggle. Uses `<a>` tags.
- **`Footer.vue`** — Copyright + "Powered by Musubi" link
- **`ColorModeToggle.vue`** — Cycles system/light/dark via `@vueuse/core` `useCycleList`. Client-only.
- **`PostPage.vue`** — Blog post: date, title, Notion content via `AutoNotionPage`
- **`ContentPage.vue`** — Static page: title, Notion content via `AutoNotionPage`
- **`AutoNotionPage.vue`** — Wrapper that detects dark mode and passes to `NotionPage`
- **`NotionPage.vue`** — Hybrid SSR/CSR rendering of Notion content:
  - Server: `react-dom/server` `renderToString` with `react-notion-x` `NotionRenderer`
  - Client: `react-dom/client` `hydrateRoot` for interactivity (tweets via `react-tweet`, code highlighting via Prism)
  - Has its own `usePrerenderData` call with `createNotionPageKey(pageId)`

### Styling

- UnoCSS (`@unocss/nuxt` with `@unocss/preset-wind4`, compatible with Tailwind CSS v4 utilities)
- CSS variables for light/dark mode in `app/assets/css/main.css`
- Notion color system mapped to site tokens (`--fg-color-*`, `--bg-color-*`)
- Layout: `--content-width: 680px`, `--site-width: 768px`

## Development Workflow

### After editing Notion content

- **Quick check**: `pnpm dev:live` — fetches per page on demand, fast feedback loop
- **Persist for offline dev**: `pnpm snapshot:update` then `pnpm dev` — fetches all pages, slower but works offline

### After editing code only

- `pnpm dev` — snapshots are fine, no need to re-fetch from Notion

### After editing Notion schema

1. Update code to read new/renamed properties
2. `pnpm snapshot:update` to persist new schema
3. `pnpm dev` to verify

### Full cycle with Notion MCP

1. Edit Notion via MCP tools
2. `pnpm dev:live` to verify changes instantly
3. `pnpm snapshot:update` to persist
4. Run verification checks

### Before committing

```bash
pnpm check:types && pnpm check:lint && pnpm check:format && pnpm check:build
```

### Git policy

- **Never push to GitHub without explicit user confirmation.** Always ask before running `git push`.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the project roadmap and open questions.

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
- **Styling**: UnoCSS with `@unocss/preset-wind4` - use utility classes
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
