# Architecture decisions

Judgments the human actually expressed about architecture — selections, acceptances, rejections. A finished implementation, a passed review, resemblance to a reference, or the absence of an objection is not acceptance. Never invent a rationale: if no reason was given, the entry says so. Entries record the judgment, not the chosen thing's full content — details live in [the target architecture](./architecture.md), linked. Edit entries in place; git keeps history.

## Decided

### Notion schema terminology

[VOUCHED @hyfdev 2026-07-19]

- **Ruling:** The default Notion Content schema must use natural English Title Case: `Title`, `Slug`, `Publish Date`, `Status`, `Type`, `Description`, `Tags`, `Show in Navigation`, and `Navigation Order`. Config must likewise use `Site Title` and `Site Description` for the two site-level values. Established publishing terms such as Post, Page, Slug, Status, Tags, and Publish Date take precedence over invented labels.
- **Limits:** `Description` remains broader than WordPress's Excerpt because Musubi permits any optional supporting text below a content title, not only a summary. `Site Description` is the separate site-wide metadata value. Spaces and capitalization are part of the canonical visible schema but are not themselves technical risks. Legacy `Date`, `ShowInNavigation`, `NavigationOrder`, and Config `Title` or `Description` names may remain accepted during migration. This decision does not make arbitrary user-created properties part of Musubi's contract.
- **Why:** Yunfei prefers `Publish Date` visually, wants the schema to borrow familiar terminology from established publishing systems such as WordPress, and does not want technical camel-case names or prefixes to make the workspace feel like an implementation detail. The system boundary should instead be communicated through the Dashboard's `System` area, database locking, exact type validation, and restrained daily views.
- **Source:** Yunfei He (@hyfdev), 2026-07-19, explicit terminology and casing decision during the Notion workspace redesign.

### User-facing Notion page inputs

- **Ruling:** The two visible Notion database pages must be named `Database` and `Config`. Musubi's public environment contract must accept `NOTION_DB_PAGE_ID` and `NOTION_CONFIG_PAGE_ID` for those pages; `scripts/notion/` must resolve the sole data source inside each page before querying it. Internal code may continue to use `content` for the Post-and-Page domain.
- **Limits:** Each page must contain exactly one data source. Zero or multiple data sources stop refresh with a direct error. Data-source IDs remain private implementation details and must not become user configuration.
- **Why:** From the user's perspective, setup consists of connecting two Notion pages. Naming the first page `Database` makes its relationship to `NOTION_DB_PAGE_ID` direct and avoids making `DB` look like an unrelated internal identifier. Exposing Notion's internal data-source layer adds an unnecessary concept and makes setup harder to understand.
- **Source:** Yunfei He (@hyfdev), 2026-07-19, explicit correction during the Cloudflare setup discussion.

### Git-tracked Notion Data boundary

- **Ruling:** Musubi must persist the fetched Notion content, called Notion Data, in Git as one Config Data JSON file and one Page Data JSON file per Published Notion page; development and check builds read these local files without fetching Notion, while a production build refreshes the same files before the site renderer reads them.
- **Limits:** Filtering Draft rows is the explicit exception: otherwise, the code that fetches and stores Notion Data must not add Musubi business or rendering rules. “Notion page” includes rows that Musubi later treats as either a Post or a Page. This decision governs neither the containing directory, page filename key, body representation, media and attachment policy, nor the exact refresh algorithm; the existing architecture statements about those subjects are outside this vouch. Changing Git tracking, file granularity, which builds may fetch Notion, or the no-Musubi-rules ingestion boundary reopens this decision.
- **Why:** Yunfei wants the directory structure to make the separation between Notion fetching and Musubi rendering visible, wants local development to avoid repeatedly fetching Notion, and prefers page-local Git diffs over rewriting one aggregate Page Data file when one page changes.
- **Source:** Yunfei He (@hyfdev), 2026-07-18, explicit direction in the Musubi architecture discussion.

### Notion code and snapshot locations

- **Ruling:** Notion retrieval must be managed outside the application framework under `scripts/notion/`, with `index.ts` as its entry point; the framework-neutral Notion Data file contract and pure ID normalization must live under `src/shared/notion-data/`; the one Git-tracked Notion Data set must live under `.musubi/notion-data-snapshot/` as `config.json` plus one JSON file per Published Notion page in `pages/`, and the site build must consume those files directly without a second aggregated content JSON such as `.musubi/site.json`.
- **Limits:** `scripts/notion/` may split retrieval implementation details into more files as it grows. `src/shared/` is ordinary Musubi source rather than a separate Void file-based convention; `src/shared/notion-data/` may contain only the persisted data contract and pure helpers required by both its producer and consumer. It must not import the Notion SDK, perform network or filesystem access, or become application-framework source. This decision does not choose the stable page filename key, the exact JSON schema, or other internal filenames. Changing either subsystem root, moving Notion retrieval into the application framework, making the application depend on retrieval implementation, or reintroducing a second aggregate reopens this decision.
- **Why:** Yunfei wants the Notion Data subsystem, including its code, managed independently from the application framework and selected the concise `scripts/notion/` name plus the shared `.musubi/` data root. A neutral contract lets the producer and consumer agree on persisted data without making Void depend on the retrieval tool. The site build can perform Musubi-specific conversion in memory, so persisting a second aggregated content JSON would duplicate the same content boundary without being needed.
- **Source:** Yunfei He (@hyfdev), 2026-07-18 original location decision and 2026-07-23 explicit clarification that Notion and font tooling stay independent from Void source.

### Font code and working-data locations

[VOUCHED @hyfdev 2026-07-18]

- **Ruling:** Font subsystem code must live under `scripts/font/`, and all repository-local font inputs, caches, and other working data must live under the Git-ignored `.musubi/font/`.
- **Limits:** This decision does not choose the internal files or subdirectories under either root, nor the final public font-output paths. Changing either root or tracking private font working data in Git reopens this decision.
- **Why:** Yunfei selected concise domain directory names and the shared `.musubi/` root; no additional rationale was given.
- **Source:** Yunfei He (@hyfdev), 2026-07-18, explicit direction during the Musubi architecture discussion.

### Snapshot consumption and rendering flow

- **Ruling:** Void build-time loaders must read `.musubi/notion-data-snapshot/` through `src/server/site/`, consume its framework-neutral contract from `src/shared/notion-data/`, use pure code under `src/shared/site/` and `src/shared/content/` to create one in-memory `Site` containing `SiteConfig`, `Post`, and `Page` values, pass only explicitly public slices through global middleware and page loaders, and keep Vue components responsible only for presentation.
- **Limits:** Production generation caches one `Site` per Node process, while development recreates it after snapshot files change. Derived routes, navigation, Home entries, Blog ordering, and parsed documents remain in memory and are never written as a second aggregate. `src/shared/site/public.ts` strips internal source and page labels before serialization. Internal helper files may split without reopening this decision if these boundaries remain intact. Persisting an aggregate site model, reading the snapshot in browser code, accessing Notion from this flow, publishing loaders as a runtime content API, or allowing repeated SSG loader execution to perform side effects reopens it. X, media, and font network work are outside this decision.
- **Why:** Yunfei approved migrating Musubi from Nuxt to Void Framework while preserving the existing Notion snapshot and static-publication boundaries.
- **Source:** Yunfei He (@hyfdev), 2026-07-23, explicit migration approval; earlier data-boundary acceptance on 2026-07-18.

### Snapshot content and refresh

[VOUCHED @hyfdev 2026-07-18]

- **Ruling:** `config.json` must preserve the Config data-source schema and raw rows, while each `pages/<notion-page-id>.json` must preserve one Published page response, its Notion Markdown response, and any retrieved unknown blocks together with an explicit snapshot schema version and Notion API version; refreshes must format deterministically, query the complete current Published roster, reuse an unchanged page only when its Notion identity, last-edited time, API version, and snapshot format still match, and replace the snapshot only after the complete refresh succeeds.
- **Limits:** Stable Notion page IDs, not slugs, name Page Data files. Volatile fetch timestamps must not create Git diffs. A failed refresh keeps the prior snapshot on disk but fails the invoking command rather than publishing stale data. This decision does not require Notion-hosted media bytes to be persisted locally, and internal JSON field names may change only with a schema-version migration.
- **Why:** Yunfei accepted the reviewed snapshot and refresh packet as presented; no additional rationale was given.
- **Source:** Yunfei He (@hyfdev), 2026-07-18, explicit acceptance during the Musubi architecture discussion.

### Notion media remains remote initially

[VOUCHED @hyfdev 2026-07-18]

- **Ruling:** The initial architecture must preserve image and attachment URLs in Notion Data and render them remotely without downloading, caching, rewriting, or Git-tracking their bytes.
- **Limits:** Notion-hosted URLs returned by the official Markdown API may expire; this is an accepted initial limitation to revisit only after it causes a concrete problem. External media follows the same direct-URL behavior. This ruling does not preclude a later measured change to a build cache, static asset copy, proxy, or external media host.
- **Why:** Yunfei rejected adding asset persistence merely to anticipate URL expiry, preferred the simpler behavior used from a reader's perspective by existing Notion starters, and explicitly chose to handle an expiry problem only if it occurs.
- **Source:** Yunfei He (@hyfdev), 2026-07-18, explicit correction immediately after vouching the architecture packet.

### X data stays a URL

[VOUCHED @hyfdev 2026-07-18]

- **Ruling:** Notion Data and the static build must keep an X embed as its source URL only; Notion refresh and site generation must not request X metadata, oEmbed, rendered HTML, or dimensions.
- **Limits:** The static renderer must retain a usable link. A future browser-only enhancement may be considered separately, but it cannot change the snapshot contract or make X availability a publication requirement.
- **Why:** Yunfei selected the simplest X boundary after rejecting build-time requests and height calculation.
- **Source:** Yunfei He (@hyfdev), 2026-07-18, explicit acceptance during the Musubi architecture discussion.

### User-facing task and network boundary

- **Ruling:** Musubi must expose `notion:setup` to create or refresh Notion Data, `font:setup` / `font:build` for pinned Charter, JetBrains Mono, optional Tsanger sources, and generated web fonts, `site:build` for the offline static site pipeline from the on-disk snapshot (brand check, font setup, font build, Void build, finalize, artifact), package entry `build` as `notion:setup` then `site:build`, package entry `dev` for local development from existing Notion Data, and `ready` for the complete local quality gate including `site:build`.
- **Limits:** `package.json` scripts are only lifecycle hooks (`postinstall`, `prepare`) and thin entries (`dev`, `build`, `preview`). All composable steps are Vite+ tasks under `vp run`. `vp dev` is the Vite+ built-in development command and is not Musubi's application entry. `generate` and `production` must not be user-facing Musubi task names; Void's Vite build remains an implementation detail inside `site:build`. `dev`, `site:build`, and `ready` must not access Notion. `font:setup` runs from postinstall, dev, and site:build; missing required Charter or JetBrains Mono source files and an attempted Tsanger setup must download successfully or fail with a clear error. `MUSUBI_TSANGER_SETUP=0` may skip only the Tsanger download attempt; it does not clear an existing Tsanger cache—use `font:setup -- --clear` when those sources must not be used. Full upstream sources stay out of Git and public artifacts.
- **Why:** Yunfei rejected mixing `build` with a misnamed `check:build`, selected `site:build` for the offline pipeline and `build` as content refresh plus that pipeline, required package scripts to stay minimal so orchestration lives in Vite+ tasks, and required font setup to fail loudly on download errors rather than soft-continue.
- **Source:** Yunfei He (@hyfdev), 2026-07-18 original task-boundary corrections; 2026-07-20 session refined task names (`site:build`), package/task split, and fail-hard `font:setup`. Prior vouch stamp removed after those wording changes pending re-vouch.

### Void Framework without Void Platform

- **Ruling:** Musubi must use Void Framework for its application and static-generation layer while continuing to deploy directly to Cloudflare; adopting Void Framework must not require Void Platform.
- **Limits:** The initial migration pins the public `void` and `@void/vue` packages at `0.10.10`, preserves Vue components and the accepted visual result, and keeps runtime rendering and ISR out of scope. A future runtime or ISR requirement reopens where Notion-derived data lives because a deployed Worker cannot read the build machine's snapshot directory.
- **Why:** Yunfei wants to migrate Musubi to Void Framework, keep Cloudflare deployment, consider future architectural change without solving hypothetical ISR now, and proceed once the public npm release was shown to support the current static site.
- **Source:** Yunfei He (@hyfdev), 2026-07-22 to 2026-07-23, explicit framework, deployment, scope, and implementation decisions.

### Static deployment target

- **Ruling:** The maintained Musubi example must generate its Wrangler configuration as part of the static build and use it to deploy `dist/client` through Cloudflare Workers Static Assets, not Cloudflare Pages, Void Platform, or a runtime Worker.
- **Limits:** The build generates the Git-ignored root `wrangler.json`, where Wrangler discovers it directly, and the configuration selects only `dist/client` for deployment without owning a Worker name. The external Workers Builds deploy command must pass its connected Worker name to Wrangler; local manual deployment must likewise supply a name. The required compatibility date and the explicit 404 and URL handling remain generated. The Worker has no `main`, assets binding, runtime Notion credentials, or server process. `dist/ssr` remains a local build artifact and may remain on disk.
- **Why:** Yunfei rejected Pages because it is being retired in favor of Workers, selected Workers explicitly, required the Void migration to keep Cloudflare deployment, and wants the Wrangler configuration to be a build result rather than independently maintained source. Cloudflare PR #1 proved that the Worker name is custom state belonging to the connected deployment rather than a value Musubi can derive or safely hardcode. Passing that external identity at deployment keeps the repository reusable, while Wrangler routing remains necessary for a visible 404 and slashless canonical URLs.
- **Source:** Yunfei He (@hyfdev), 2026-07-19 Cloudflare direction, 2026-07-23 Void migration, static-output, generated-root-Wrangler-configuration, and retained-build-artifact decisions, and 2026-07-24 correction after [Cloudflare PR #1](https://github.com/hyfdev/musubi/pull/1); verified locally with Wrangler 4.112.0 root configuration discovery and name-conflict behavior, and against Cloudflare's documented Worker name requirement.

## Open