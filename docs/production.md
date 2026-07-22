# Production Operations

Musubi's maintained example targets Cloudflare Workers Static Assets at `https://musubi.hyf.me`. It deploys the generated static site without a Worker script, Nitro server, or runtime bindings. The existing Vercel project remains available only as a migration rollback until the Cloudflare deployment is accepted on the custom domain.

## Build contract

Workers Builds installs the pinned pnpm dependencies, runs `pnpm exec vp run site:build` for the maintained snapshot-based example, and publishes only `.output/public` with `pnpm exec wrangler deploy`. This path reads the Git-tracked `.musubi/notion-data-snapshot/` and does not contact Notion. A separately connected site can use `pnpm run build` (package entry: `notion:setup` then `site:build`) to refresh that snapshot before the same static site pipeline and artifact checks. Neither path serves `.output/server`, a Nitro process, a Notion API route, the Notion Data snapshot, or browser-side Notion credentials.

Musubi's internal generation command explicitly passes Nitro's `static` preset. Workers Builds otherwise identifies itself as Cloudflare CI and the Nuxt CLI selects its runtime `cloudflare-module` preset, whose generated `.wrangler/deploy/config.json` redirects Wrangler away from the repository's static-assets configuration and expects `.output/server/index.mjs`. That runtime entry is intentionally absent from `nuxt generate`. The artifact gate rejects any such generated redirect before deployment.

The repository pins Node through `.node-version`, pnpm through `packageManager`, and Wrangler as a development dependency. Configure the Worker build with production branch `main`, build command `pnpm exec vp run site:build` for the maintained snapshot-based example, deploy command `pnpm exec wrangler deploy`, and `PNPM_VERSION=11.14.0`. `NODE_VERSION=24.18.0` may also be set explicitly as a redundant build-image guard. A site that intentionally publishes the latest connected Notion workspace on every deployment uses `pnpm run build` instead and supplies the three build-only Notion values below.

Only a connected site that uses `pnpm run build` needs these Workers Builds variables or secrets. They are build inputs, not Worker runtime bindings:

- `NOTION_TOKEN`
- `NOTION_DB_PAGE_ID`
- `NOTION_CONFIG_PAGE_ID`

Use a dedicated read-only Notion integration for routine production builds. Musubi does not require a write-capable Notion credential. Non-production branch builds remain disabled initially; if enabled later, they should run `vp run site:build` from the tracked snapshot without receiving Notion credentials.

The default cloud build keeps the checked-in, open-licensed LXGW WOFF2 shards as a verified source pool instead of downloading the 25 MB source TTF, but publishes only small content-derived subsets for Chinese mappings absent from either Tsanger source. The repository retains the source version, checksums, renamed identity, OFL notice, and maintenance-only rebuild program. `vp run font:setup` runs from `postinstall`, `dev`, and `site:build`; it prepares pinned Charter and JetBrains Mono sources and a missing Tsanger pair. Required Latin source failure or an attempted Tsanger download failure stops the pipeline. Set `MUSUBI_TSANGER_W04_URL` / `MUSUBI_TSANGER_W05_URL` in the builder to mirror Tsanger sources, or `MUSUBI_TSANGER_SETUP=0` to skip only that download attempt; clear the private Tsanger cache if the builder must not use a prior pair. Upstream source files and the ignored `.musubi/font/` cache must never become deployment artifacts.

The snapshot keeps remote Notion image and file URLs unchanged; production does not copy those media into the artifact. An X embed keeps only its source URL and renders as a safe ordinary link. Neither `vp run notion:setup` nor the static build requests X oEmbed data or loads X's browser widget script.

Local development and verification use the tracked snapshot without Notion access:

```sh
pnpm run dev
vp run site:build
vp run ready
```

Run `vp run notion:setup` when the checked-in snapshot should be refreshed independently of a production build. Commit its per-page JSON changes with the corresponding source change when the repository should retain that revision.

## Publishing

The first Cloudflare deployment is created without attaching `musubi.hyf.me`:

1. Push the prepared commit to `main`.
2. Let Workers Builds publish the `musubi` Worker to its `workers.dev` URL.
3. Verify Home, Blog, a Post, slashless canonical routes, the visible 404 response, fonts, themes, and cache headers.
4. Record the existing Vercel DNS target and deployment ID, then attach `musubi.hyf.me` as the Worker Custom Domain.
5. Verify the same surfaces on the custom domain before retiring the Vercel fallback.

Notion-only changes use the smallest explicit trigger:

1. Publish the intended rows in Notion.
2. Retrigger the production build for the current `main` commit in Workers Builds.
3. Verify the changed route and one direct hard refresh at `https://musubi.hyf.me`.

This trigger deliberately remains manual. Automatic Notion webhooks can be added later only when their operational value justifies another credential and failure path.

## Deployment rollback

For an application or content regression after the cutover, roll the Worker back to the preceding successful version. During the migration observation period, a Cloudflare access or routing failure can instead be reversed by removing the Worker Custom Domain and restoring the recorded Vercel DNS target. Keep the Vercel project until the Cloudflare deployment has remained healthy for the chosen observation period.

If the problem came from content, correct or revert it in Notion and rebuild. The tracked Notion Data snapshot can reproduce the prior state locally with `vp run site:build`; rolling back a deployment never writes to Notion.

## Static delivery contract

`wrangler.jsonc` deliberately has no `main`, assets binding, or `nodejs_compat` flag. It serves `.output/public`, maps unmatched navigation to the generated `404.html`, and preserves Musubi's slashless canonical URLs. `public/_headers` preserves the production HSTS policy, gives content-addressed Nuxt assets and WOFF2 files a one-year immutable browser policy, prevents `workers.dev` preview URLs from being indexed, and leaves HTML plus stable generated metadata on Cloudflare's default revalidation behavior. Never put mutable content behind an immutable URL.