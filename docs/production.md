# Production Operations

Musubi's maintained example targets Cloudflare Workers Static Assets at `https://musubi.hyf.me`. It deploys the generated static site without a Worker script, Void runtime server, or runtime bindings.

## Build contract

Workers Builds installs the pinned pnpm dependencies, runs `pnpm exec vp run site:build` for the maintained snapshot-based example, and publishes only `dist/client` with `pnpm exec wrangler deploy`. This path reads the Git-tracked `.musubi/notion-data-snapshot/` and does not contact Notion. A separately connected site can use `pnpm run build` (package entry: `notion:setup` then `site:build`) to refresh that snapshot before the same static site pipeline and artifact checks. Neither path serves `dist/ssr`, a Void runtime process, a Notion API route, the Notion Data snapshot, or browser-side Notion credentials.

`void.json` fixes the build boundary at `target: "node"` and `output: "static"`: loaders may read the local snapshot during generation, while deployment still contains no loader or runtime Worker. Void writes client files to `dist/client` and build-only server files to `dist/ssr`; Wrangler is explicitly configured to publish only the former. Void 0.10.10 may continue after an individual prerender failure, so the artifact gate requires both HTML and `/_void/pages/*.json` for every route and rejects any generated Wrangler redirect before deployment.

The repository pins Node through `.node-version`, pnpm through `packageManager`, and Wrangler as a development dependency. Configure the Worker build with production branch `main`, build command `pnpm exec vp run site:build` for the maintained snapshot-based example, deploy command `pnpm exec wrangler deploy`, and `PNPM_VERSION=11.14.0`. `NODE_VERSION=24.18.0` may also be set explicitly as a redundant build-image guard. A site that intentionally publishes the latest connected Notion workspace on every deployment uses `pnpm run build` instead and supplies the three build-only Notion values below.

Only a connected site that uses `pnpm run build` needs these Workers Builds variables or secrets. They are build inputs, not Worker runtime bindings:

- `NOTION_TOKEN`
- `NOTION_DB_PAGE_ID`
- `NOTION_CONFIG_PAGE_ID`

Use a dedicated read-only Notion integration for routine production builds. Musubi does not require a write-capable Notion credential. Non-production branch builds remain disabled initially; if enabled later, they should run `vp run site:build` from the tracked snapshot without receiving Notion credentials.

The default cloud build publishes the 32 checked-in, open-licensed LXGW WOFF2 runtime shards instead of downloading the 25 MB source TTF. Ten shards cover the fixed common-character groups and 22 cover the remaining classifier-reachable mappings in bounded Unicode-region chunks. Together they cover every pinned LXGW mapping Musubi's Chinese typography classifier can select while excluding ASCII, ordinary Latin, and unrelated mappings; their `unicode-range` declarations keep them off the network until Tsanger lacks a rendered Chinese character. The repository retains the source version, checksums, renamed identity, OFL notice, fixed hot-shard provenance, and maintenance-only rebuild program. Ordinary builds never contact Google Fonts. `vp run font:setup` runs from `postinstall`, `dev`, and `site:build`; it prepares pinned Charter and JetBrains Mono sources and a missing Tsanger pair. Required Latin source failure or an attempted Tsanger download failure stops the pipeline. Set `MUSUBI_TSANGER_W04_URL` / `MUSUBI_TSANGER_W05_URL` in the builder to mirror Tsanger sources, or `MUSUBI_TSANGER_SETUP=0` to skip only that download attempt; clear the private Tsanger cache if the builder must not use a prior pair. Upstream source files and the ignored `.musubi/font/` cache must never become deployment artifacts.

The snapshot keeps remote Notion image and file URLs unchanged; production does not copy those media into the artifact. An X embed keeps only its source URL and renders as a safe ordinary link. Neither `vp run notion:setup` nor the static build requests X oEmbed data or loads X's browser widget script.

Local development and verification use the tracked snapshot without Notion access:

```sh
pnpm run dev
vp run site:build
vp run ready
```

Run `vp run notion:setup` when the checked-in snapshot should be refreshed independently of a production build. Commit its per-page JSON changes with the corresponding source change when the repository should retain that revision.

## Publishing

Application and configuration changes use the connected Workers Builds pipeline:

1. Push the reviewed commit to `main`.
2. Let Workers Builds publish the new `musubi` Worker version.
3. Verify Home, Blog, a Post, slashless canonical routes, the visible 404 response, fonts, themes, and cache headers at `https://musubi.hyf.me`.

For the maintained snapshot-based example, Notion-only changes use the same reviewed Git boundary as application changes:

1. Publish the intended rows in Notion.
2. Run `vp run notion:setup`, review the snapshot diff, and commit it.
3. Push the reviewed commit to `main` so Workers Builds runs the offline `site:build`.
4. Verify the changed route and one direct hard refresh at `https://musubi.hyf.me`.

A separately connected site configured with `pnpm run build` and the three Notion build inputs may instead retrigger its current production commit because that build command refreshes the snapshot before static generation.

This trigger deliberately remains manual. Automatic Notion webhooks can be added later only when their operational value justifies another credential and failure path.

## Deployment rollback

For an application or content regression, roll the Worker back to the preceding successful version.

If the problem came from content, correct or revert it in Notion and rebuild. The tracked Notion Data snapshot can reproduce the prior state locally with `vp run site:build`; rolling back a deployment never writes to Notion.

## Static delivery contract

`wrangler.jsonc` deliberately has no `main`, assets binding, or `nodejs_compat` flag. It serves `dist/client`, maps unmatched navigation to the generated `404.html`, and preserves Musubi's slashless canonical URLs. `public/_headers` preserves the production HSTS policy, gives content-addressed `/assets/*` files and generated WOFF2 files a one-year immutable browser policy, prevents `workers.dev` preview URLs from being indexed, and leaves HTML, `/_void/pages/*`, and stable generated metadata on Cloudflare's default revalidation behavior. The artifact gate rejects every unhashed file under `/assets/`, so the broad immutable rule cannot silently capture a mutable URL.