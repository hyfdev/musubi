# Production Delivery

## Status

Production delivery is in progress. The repository and Notion source are coherent; the remaining path is the existing Vercel `musubi` project Preview, promotion, and live verification.

## Production target

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

## Acceptance evidence so far

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

## Remaining production steps

1. Authenticate to the existing Vercel scope, inspect the earlier v2 failure logs, and configure the three Notion values for the `musubi` project's Preview and Production environments.
2. Commit and push `v2`.
3. Verify the `musubi` Preview, promote it, complete live production acceptance, and record the resulting deployment and rollback command.