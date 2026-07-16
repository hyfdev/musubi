# Production Delivery

## Status

Repository-local production readiness is complete. The repository and Notion source are coherent, the production artifact has passed local verification, and the accepted site has passed representative browser acceptance. Per Yunfei's 2026-07-16 direction, this delivery did not authenticate to Vercel, change hosting or DNS configuration, promote a deployment, or claim that the v2 artifact is live.

## Documented production target

- Public URL: `https://musubi.hyf.me`
- Repository: `hyfdev/musubi`
- Source branch: `v2`
- Hosting project: Vercel project `musubi` in the existing `hyf` scope
- DNS path: Cloudflare-proxied `musubi.hyf.me` to the existing Vercel project
- Separate system: the `hyf.me` Vercel project and its personal-site Notion source are not part of this delivery

No DNS change is required. Before replacement, public DNS returned Cloudflare anycast IPv4 `104.18.24.74` and `104.18.25.74` plus IPv6 `2606:4700::6812:184a` and `2606:4700::6812:194a`; the live response contained both Cloudflare and Vercel headers.

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

## Repository delivery contract

- `pnpm run build` runs the production generation and static artifact verifier.
- `vercel.json` selects a static deployment of `.output/public`.
- Hashed Nuxt assets, generated content assets, and generated WOFF2 files receive one-year immutable caching.
- HTML and stable generated metadata retain revalidation.
- Production requires only the three documented Notion environment values.
- Routine Vercel builds use a read-only Notion integration.
- The default cloud build uses the open LXGW fallback; private Tsanger setup remains optional.
- Notion-only publication uses an explicit Vercel redeploy, while code delivery uses a v2 Preview followed by promotion.

## Local acceptance evidence

- The migration dry run identified only the expected schema, legacy row, About, and Timezone changes.
- The applied migration reread and verified the complete affected sources.
- A second apply was an idempotent no-op.
- Focused Page compatibility tests and Nuxt type checking passed.
- Repository lint passed, including Google's official `designmd lint DESIGN.md`.
- A production build with an intentionally empty Tsanger cache completed using only the open fallback.
- The static artifact verifier passed with 36 files and 10,497,722 bytes.
- The artifact contains no `/about` route, exact Notion secrets, raw TTF/OTF/WOFF sources, Tsanger subset, or expiring Notion asset URL.
- The complete uncached `vp run ready` gate passed with 43 tests and a configured W04/W05 build; its verified artifact contains 38 files and 10,671,349 bytes.
- A production-like static browser review used Chrome 150 at `1440x900` and `390x844`. It covered Home, the complete year-grouped Blog, a Chinese Post, an 11-code-block Post, and 404 because production has no Published Page.
- Light, Dark, and live System resolution worked; explicit and System choices persisted; heading permalinks changed the fragment; Copy reported success; external links used a new context with `noopener noreferrer`; header and footer were both 89 CSS pixels in the narrow layout; document overflow remained zero.
- W04 and W05 loaded for their configured roles, the code blocks kept the GitHub palette, the mobile footer remained on one line, direct 404 entry returned HTTP 404 with `noindex`, and no unexpected browser console or page error appeared.
- The later X embed enhancement prepared both Published X posts successfully through the official Publish oEmbed endpoint and recorded `2` enriched, `0` fallback in the schema-version-`2` private site artifact.
- The corresponding production build again emitted 38 verified public files, now totaling 10,752,614 bytes. Generated Post HTML contains the complete author, handle, post text, publication label, and X link without a Nuxt client entry script.
- Production-like browser checks at `1440x900` and `390x844` confirmed the official X widget on direct entry, Light-to-Dark widget recreation, zero document overflow, and no unexpected page error. Blocking both X widget hosts left the complete static quotation visible with no iframe; a fresh Home load contained no embed and appended no external X widget script.

## External deployment boundary

The production target, publishing mechanism, and rollback baseline remain documented for an operator who later chooses to deploy the artifact. They are not remaining actions in this repository-local delivery. No Vercel credential or account change is required to reproduce the local production build and acceptance evidence above.

## Known historical residual

The current tracked tree and generated public artifact contain none of the three configured Notion environment values, and a full-history blob scan found no Notion credential. Older public commits do retain Notion source locator IDs and the deleted prototype `.snapshot` corpus. Source locators alone do not authorize workspace access, but removing those historical blobs completely would require a separately authorized source rotation and Git history rewrite. This delivery records the residual and does not force-push or rewrite shared history.