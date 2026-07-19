# Production Delivery

## Status

Repository-local production readiness is complete, and the delivery target is being migrated from Vercel to Cloudflare Workers Static Assets. The repository and Notion source are coherent, the production artifact has passed local verification, and the accepted site has passed representative browser acceptance. Repository preparation does not authenticate to Cloudflare, change hosting or DNS configuration, promote a deployment, or claim that the v2 artifact is live.

## Documented production target

- Public URL: `https://musubi.hyf.me`
- Repository: `hyfdev/musubi`
- Source branch: `main`
- Hosting target: Cloudflare Worker `musubi`, serving static assets only
- Migration path: validate the `workers.dev` deployment before attaching `musubi.hyf.me` as a Worker Custom Domain
- Temporary rollback path: the existing Vercel project remains connected until the Worker is accepted
- Separate system: the `hyf.me` Vercel project and its personal-site Notion source are not part of this delivery

The final cutover replaces the current Cloudflare-proxied Vercel origin with a Worker Custom Domain. Before replacement, public DNS returned Cloudflare anycast IPv4 `104.18.24.74` and `104.18.25.74` plus IPv6 `2606:4700::6812:184a` and `2606:4700::6812:194a`; the live response contained both Cloudflare and Vercel headers.

## Rollback baseline

The current successful `musubi.hyf.me` artifact predates the v2 architecture:

- Git commit: `2bb5dd6d73c6d79c8e2d651bffe64319847f841b`
- Vercel deployment URL: `https://musubi-frwwoowvf-hyf.vercel.app`
- Vercel deployment ID: `6usaCtb1Gmvnog93kmheCpSB367y`
- Build timestamp observed in the artifact: `2026-02-17T14:02:43Z`

Vercel retained this deployment after later production failures, proving that a failed build does not move the current production alias. If v2 is unhealthy after promotion, Instant Rollback reassigns `musubi.hyf.me` to this baseline.

## Notion migration

The confirmed `musubi.hyf.me` source was migrated on 2026-07-16:

- Added `Page` while retaining legacy `Content` as a schema rollback option.
- Added `ShowInNavigation` and `NavigationOrder`.
- Migrated the one legacy Content row to Page.
- Changed the example About Page from Published to Draft without deleting or trashing it.
- Added an enabled `Timezone = Asia/Singapore` Config row.
- Preserved all slugs and Post rows.

The private rollback snapshot is stored at `.musubi/notion-migrations/2026-07-16T14-21-51-474Z-content-to-page.json` with mode `0600`. It contains the complete pre-write schemas, rows, and page Markdown and is ignored by Git. A second apply completed as an idempotent no-op.

After migration, the source has 27 rows: 19 Published Posts, seven Draft Posts, and one Draft Page. The production route manifest has 21 routes: Home, Blog, and 19 Posts. There is no published About route.

### Notion workspace redesign

The maintained example workspace was standardized on 2026-07-19 without changing content bodies or public sharing:

- Content now uses the canonical `Publish Date`, `Show in Navigation`, and `Navigation Order` property names, with exactly `Post` and `Page` Type options and `Draft` and `Published` Status options.
- Config now uses `Help` as its title property and the canonical `Site Title` and `Site Description` keys. The unused `Since` and `PostsPerPage` options were removed.
- The underlying database is named `Content`; both Content and Config are locked against accidental schema changes while row values remain editable.
- The Dashboard retains its collapsed `System` section and now presents one linked Content database with filtered `Posts` and `Pages` views. The old duplicate tables, headings, table of contents, and extra divider were removed.
- The current source has 24 rows: 23 Posts and one Page; 16 rows are Published. It also has eight Config rows. Counts were verified before and after migration.

Two private pre-write snapshots are stored under `.musubi/notion-migrations/` with mode `0600` and are ignored by Git. The second apply verified that the migration is safe to rerun and fixed the visible view-column order to put `Title` first.

## Repository delivery contract

- The maintained example uses `pnpm exec vp run check:build` to build the tracked Notion Data without source credentials; a connected site can use `pnpm run build` to refresh Notion Data first.
- `wrangler.jsonc` selects a static-only deployment of `.output/public`, serves the generated 404, and preserves slashless canonical routes.
- The internal Nuxt command passes `--preset static`, and the artifact gate rejects a generated Wrangler redirect that would replace the assets-only deployment with a runtime Worker.
- `public/_headers` gives hashed Nuxt assets and generated WOFF2 files one-year immutable caching while preventing `workers.dev` previews from being indexed.
- HTML and stable generated metadata retain revalidation.
- A connected build requires only the three documented Notion environment values and supplies its read-only integration only as build-time configuration; the maintained snapshot build requires none of them.
- Development, `check:build`, and `ready` consume the tracked per-page Notion Data snapshot without Notion access.
- The default cloud build verifies and copies the checked-in open LXGW WOFF2 fallback bundle; it does not download or regenerate the 25 MB source. Private Tsanger setup remains optional.
- Notion-only publication uses an explicit Workers Build retrigger, while code delivery builds the `main` production branch.

## Local acceptance evidence

- The latest `vp run notion:setup` refresh wrote one Config file and 16 Published Page Data files, reused all 16 unchanged page bodies, and removed the three pages no longer Published from the tracked snapshot.
- With all three Notion environment variables removed, `vp run ready` passed formatting, lint, Google's official `designmd lint DESIGN.md`, Nuxt type checking, 70 focused tests, brand verification, local static generation, and artifact verification. The font-bundle test decodes all eight WOFF2 files and proves that their actual cmaps equal the manifest's non-overlapping 46,490-code-point coverage.
- Before the fallback bundle was checked in, a fresh local clone spent approximately 105 seconds of a 114-second `check:build` generating the same fallback fonts; Cloudflare spent approximately 193 seconds on that step. The new fallback-only cold font path completed in 1.7 seconds without a source download, and the complete forced-Cloudflare `check:build` completed in 10.5 seconds including Vite+ package verification and Nuxt generation.
- With `WORKERS_CI=1` and `NITRO_PRESET=cloudflare_module` forced, Nuxt still reported `Nitro preset: static`, created neither `.wrangler/deploy/config.json` nor `.output/server/index.mjs`, and passed the static artifact gate. `pnpm exec wrangler deploy --dry-run` then read the repository assets-only configuration, found no bindings, and completed successfully.
- A fallback-only build under forced Cloudflare CI inputs generated 21 prerender inputs and emitted 34 verified public files totaling 10,410,165 bytes. The corresponding Wrangler dry run read 55 deployable asset and control files.
- The existing local Tsanger opt-in cache remains private under `.musubi/font/tsanger/`. A local `check:build` verified its W04/W05 subsets together with the prebuilt fallback as 36 public files totaling 10,413,452 bytes, and the next unchanged font step can reuse that complete output.
- The public artifact contains Home, Blog, 16 Post routes, and the real 404 document; it contains no About route, snapshot directory, Notion token, raw font source, public API, X widget script, or X oEmbed representation.
- The two X references render as ordinary safe external links. Notion image and attachment URLs remain remote by the accepted initial architecture rather than being copied into the artifact.

## External deployment boundary

The production target, publishing mechanism, migration rollback, and Vercel baseline remain documented for the Cloudflare cutover. No Cloudflare credential or account change is required to reproduce the local production build and acceptance evidence above.

## Known historical residual

The current tracked tree and generated public artifact contain none of the three configured Notion environment values, and a full-history blob scan found no Notion credential. Older public commits do retain Notion source locator IDs and the deleted prototype `.snapshot` corpus. Source locators alone do not authorize workspace access, but removing those historical blobs completely would require a separately authorized source rotation and Git history rewrite. This delivery records the residual and does not force-push or rewrite shared history.