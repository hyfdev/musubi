# Agent Guidelines for Musubi

## Project Overview

Musubi is a **personal blog/website** powered by **Void** (`void` + `@void-x/vue`) that uses **Notion as a CMS**. Content is authored in Notion, fetched server-side via `notion-client`, and rendered using `react-notion-x`. Void provides SSR with Vue and runs on Cloudflare Workers via Hono.

## Build & Development Commands

- **Install**: `pnpm install` (required package manager)
- **Dev**: `pnpm dev` (starts Vite dev server, uses snapshots by default)
- **Dev (live)**: `pnpm dev:live` (starts Vite dev server, fetches live data from Notion API)
- **Build**: `pnpm build` (production build — bundles Worker + client assets for deployment)
- **Preview**: `pnpm preview` (preview production build)

## Snapshots

Snapshots are committed, point-in-time copies of Notion data stored in `.notion-data-snapshot/`. They allow `pnpm dev` and `pnpm check:build` to run locally without hitting the Notion API. Snapshots include both the pages database and the config database.

- `pnpm dev` uses snapshots (`VITE_USE_SNAPSHOT=1`)
- `pnpm build` does NOT use snapshots — the Worker fetches live from Notion API during local prerendering
- `pnpm check:build` uses snapshots (`VITE_USE_SNAPSHOT=1`)
- After adding/changing content in Notion, run `pnpm snapshot:update` to regenerate snapshots

**Snapshot internals:** Snapshot data is embedded at **Vite compile time** via a virtual module (`virtual:snapshot-data`). The `snapshotPlugin()` in `vite.config.ts` reads `.notion-data-snapshot/` files during the Vite build (in Node.js) and inlines them into the bundle. When `VITE_USE_SNAPSHOT` is not set (e.g. `pnpm build`), the virtual module returns an empty object — no snapshot data is bundled.

- `.notion-data-snapshot/manifest.json` stores the database page ID
- Each `{pageId}.json` file contains a `compress-json`-compressed `ExtendedRecordMap`
- `server/notion/snapshot.ts` provides read-only access via `readSnapshot()` and `readSnapshotManifest()`
- `virtual-snapshot.d.ts` provides TypeScript types for the virtual module
- Write operations (updating snapshots) are done via a separate CLI script, not inside the Worker

### SSG and Deployment

Musubi uses Void's SSG mode (`"output": "static"` in `void.json`). `pnpm build` prerenders locally — it spins up Miniflare, runs the Worker for each route, and writes static HTML to `dist/client/`.

- `pnpm build` — builds Worker bundle + client assets, then prerenders all routes locally. The Worker fetches live data from the Notion API during prerendering. Produces `.html` files in `dist/client/`.
- `pnpm check:build` — same as `pnpm build` but with `VITE_USE_SNAPSHOT=1`, so the Worker reads from embedded snapshot data instead of hitting the Notion API. Useful for offline/CI verification.
- `void deploy` — uploads the pre-built output (including the `.html` files) to Void's platform.

## Architecture

### Framework: Void Pages Mode

Musubi uses Void's **pages mode** — each page has a `.vue` component and a companion `.server.ts` file:

- `.server.ts` exports a `loader` (via `defineHandler`) that runs server-side and returns typed props
- `.vue` component receives props via `defineProps<Props>()` and renders the page
- SSR is handled by Void's `voidVue()` plugin

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

### Server Code Architecture (`server/`)

```
server/
├── notion/
│   ├── NotionDatabasePage.ts    # Fetches database, extracts child page IDs
│   ├── NotionStandalonePage.ts  # Base class: fetches single page, property access
│   └── snapshot.ts              # Snapshot read via virtual module (compile-time embedded)
├── musubi-notion/
│   ├── MusubiPage.ts            # Extends NotionStandalonePage: parses Title/Slug/Date/Status/Type/Tags
│   └── ConfigPage.ts            # Extends NotionDatabasePage: parses Name/Value pairs → config object
└── website/
    ├── Website.ts               # Singleton orchestrator: caches all pages, provides getters
    ├── resolveWebsiteConfig.ts  # Config from Notion (NOTION_CONFIG_PAGE_ID) — no local fallback
    ├── getSharedData.ts         # Helper: fetches navbar/footer data for all pages
    ├── renderNotionHtml.ts      # Pre-renders Notion content to HTML via react-dom/server
    ├── types.ts                 # Post = {meta: PostMeta, recordMap: ExtendedRecordMap}
    └── types/
        ├── PostMeta.ts          # {pageId, title, slug, date, description, tags}
        └── WebsiteConfig.ts     # {title?, description?, author?, social?: {github?, x?}}
```

### Data Flow

```
Notion API (live, at local prerender time during `pnpm build`) or virtual:snapshot-data (dev/check:build)
  → NotionDatabasePage.fetchRecordMapCached() → child page IDs
  → MusubiPage(pageId) → {title, slug, date, status, type, tags}
  → Website filters/caches → PostMeta[] and Post objects
  → .server.ts loaders (defineHandler) → typed Props
  → .vue components (defineProps<Props>()) → HTML
```

## Frontend Architecture

### Routes

| Route                     | Page File                          | Server File                              |
| ------------------------- | ---------------------------------- | ---------------------------------------- |
| `/`                       | `pages/index.vue`                  | `pages/index.server.ts`                  |
| `/blog/[slug]`            | `pages/blog/[slug].vue`            | `pages/blog/[slug].server.ts`            |
| `/blog/page/[page]`       | `pages/blog/page/[page].vue`       | `pages/blog/page/[page].server.ts`       |
| `/tags`                   | `pages/tags/index.vue`             | `pages/tags/index.server.ts`             |
| `/tags/[tag]`             | `pages/tags/[tag]/index.vue`       | `pages/tags/[tag]/index.server.ts`       |
| `/tags/[tag]/page/[page]` | `pages/tags/[tag]/page/[page].vue` | `pages/tags/[tag]/page/[page].server.ts` |
| `/[slug]`                 | `pages/[slug].vue`                 | `pages/[slug].server.ts`                 |

### Layout Pattern

Each page wraps its content in `<AppLayout :shared="shared">`. The `shared` data (navbar items, social links, author, title) is fetched by `getSharedData()` in every `.server.ts` loader.

- `pages/layout.vue` — Void root layout, imports global CSS and UnoCSS
- `components/AppLayout.vue` — Visual layout shell (Navbar + main + Footer), receives shared data as props

### Components (`components/`)

- **`AppLayout.vue`** — Layout shell: Navbar, main content slot, Footer. Receives `SharedData` props.
- **`Navbar.vue`** — Site header: home link, content page links, social icons, color mode toggle. Receives props.
- **`Footer.vue`** — Copyright + "Powered by Musubi" link. Receives `author` prop.
- **`ColorModeToggle.vue`** — Cycles auto/light/dark via `@vueuse/core` `useColorMode` + `useCycleList`.
- **`PostPage.vue`** — Blog post: date, title, tags, Notion content via `AutoNotionPage`. Receives props.
- **`ContentPage.vue`** — Static page: title, Notion content via `AutoNotionPage`. Receives props.
- **`AutoNotionPage.vue`** — Wrapper that detects dark mode and passes to `NotionPage`.
- **`NotionPage.vue`** — Hybrid SSR/CSR rendering of Notion content:
  - Receives pre-rendered HTML (`serverHtml`) and `recordMap` as props
  - Client: `react-dom/client` `hydrateRoot` for interactivity (tweets via `react-tweet`, code highlighting via Prism)
- **`PostList.vue`** — Reusable post listing with date, tags, description.
- **`PaginationNav.vue`** — Previous/Next pagination controls.
- **`icons/*.vue`** — Inline SVG icon components (MdiGithub, MdiTwitter, MdiMenu, MdiClose, etc.)

### Styling

- UnoCSS (`unocss/vite` with `@unocss/preset-wind4`, compatible with Tailwind CSS v4 utilities)
- CSS variables for light/dark mode in `assets/css/main.css`
- Notion color system mapped to site tokens (`--fg-color-*`, `--bg-color-*`)
- Layout: `--content-width: 680px`, `--site-width: 768px`

## Development Workflow

### After editing Notion content

- Update snapshots, then `pnpm dev`

### After editing code only

- `pnpm dev` — snapshots are fine, no need to re-fetch from Notion

### Before committing

```bash
pnpm check:types && pnpm check:lint && pnpm check:format && pnpm check:build
```

### Git policy

- **Never push to any remote without explicit user confirmation.** Always ask before running `git push`, including for other repos (e.g. `void`).

## Code Style

- **Indentation**: 2 spaces (see .editorconfig)
- **TypeScript**: Enabled, use TypeScript for all new files
- **Imports**: Explicit imports required (no auto-imports)
- **Components**: Place in `components/` directory
- **Server code**: Place in `server/` directory, import in `.server.ts` loaders
- **Naming**: PascalCase for components (e.g., `Navbar.vue`), camelCase for functions

## Framework Conventions

- **Structure**:
  - `pages/` — Page components (`.vue`) and server loaders (`.server.ts`)
  - `components/` — Reusable Vue components
  - `server/` — Server-only code (Notion API, data fetching)
  - `utils/` — Shared utilities
  - `assets/` — CSS and static assets
- **Styling**: UnoCSS with `@unocss/preset-wind4` - use utility classes
- **Config**: Main config in `vite.config.ts`, Void config in `void.json`
- **Routes**: Auto-generated from `pages/` directory by Void

## Verification

MANDATORY: Always run verification commands after making changes.

- **Type Checking**: `pnpm check:types` (checks type errors with vue-tsc)
- **Linting**: `pnpm check:lint` (checks linting issues with oxlint)
- **Format Check**: `pnpm check:format` (checks formatting with oxfmt)
- **Build**: `pnpm check:build` (verifies build with snapshots)

To auto-fix issues:

- **Fix Lint**: `pnpm fix:lint` (auto-fix linting issues)
- **Fix Format**: `pnpm fix:format` (auto-format code)

# Common Pitfalls & Best Practices

- **Use `<a>` tags for navigation:** Musubi uses `<a>` tags for all internal links. This ensures full page loads with server-rendered content.

- **Vue SFC block order - `<script>` first pattern:** Always organize Vue Single File Components with the following block order: `<script setup lang="ts">` → `<template>` → `<style>` (if present).

- **Server code stays in `.server.ts`:** All Notion data fetching and processing happens in `.server.ts` loaders via `defineHandler`. Server code in `server/` is only imported from `.server.ts` files — never from `.vue` components.

- **Minimize props returned from loaders:** The props returned from `defineHandler` loaders are serialized as JSON and embedded in the page. Only return the data actually needed for rendering.

- **Shared data via `getSharedData()`:** Every page's loader calls `getSharedData()` to get navbar/footer data. This is passed to `<AppLayout :shared="shared">` which distributes it to Navbar and Footer.

- **Notion HTML pre-rendering:** Blog post and content page loaders call `renderNotionHtml()` to pre-render Notion content to HTML on the server. The client then hydrates with React for interactivity.

- **Icons via `unplugin-icons`:** Icons use `unplugin-icons/vite` with `compiler: 'vue3'`. Import as `import Icon from '~icons/mdi/icon-name'`. TypeScript types are provided by `unplugin-icons/types/vue3` in `tsconfig.json`.

- **oxlint:** `pnpm check:lint` should show **0 warnings and 0 errors**.

- **`.server.ts` loader + page pattern:**

  ```typescript
  // pages/example.server.ts
  import { defineHandler } from 'void'

  export interface Props {
    title: string
  }

  export const loader = defineHandler<Props>(async (c) => {
    // c is the Hono context — access params via c.req.param('slug')
    // Import server code dynamically here
    return { title: 'Hello' }
  })
  ```

  ```vue
  <!-- pages/example.vue -->
  <script setup lang="ts">
  import type { Props } from './example.server'
  const props = defineProps<Props>()
  </script>

  <template>
    <h1>{{ props.title }}</h1>
  </template>
  ```

## Known Gaps

- **No error/404 page:** Void loaders use `c.notFound()` but there is no custom error page yet.
- **No Google Analytics:** Needs a manual script tag in the layout or a Void-compatible alternative.
- **Deployment deferred:** Void is not published to npm yet. The `void` and `@void-x/vue` packages are locally linked from `../void/packages/`. Deployment will be addressed once Void is released.
- **Vite 8 beta:** Void requires `vite@^8.0.0-beta.14`. This is a pre-release version of Vite.

<!--injected-by-void-v0.0.1-->

## Void

This project uses [Void](https://void.cloud) — a fullstack Vite plugin + deployment platform for Cloudflare. `voidPlugin()` in `vite.config.ts` gives you file-based API routing on Hono (`routes/`), Inertia-inspired server-rendered pages with co-located loaders/actions (`pages/` + `void/vue` or `void/react`), auto-provisioned D1/KV/R2 bindings, end-to-end type safety (SQL migrations -> typed DB -> typed routes -> typed fetch client), built-in auth, queues, cron jobs, edge caching (ISR), and one-command deploys via `npx void deploy`.

Full docs are in `node_modules/void/docs/`. If you have the `void` skill available, use it for a complete API reference covering project structure, routing, pages mode, database, auth, typed fetch, KV, storage, queues, cron jobs, CLI, configuration, and deployment.

<!--/injected-by-void-->
