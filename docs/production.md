# Production Operations

Musubi's maintained example targets Cloudflare Workers Static Assets at `https://musubi.hyf.me`. It deploys the generated static site without a Worker script, Nitro server, or runtime bindings. The existing Vercel project remains available only as a migration rollback until the Cloudflare deployment is accepted on the custom domain.

## Build contract

Workers Builds installs the pinned pnpm dependencies, runs `pnpm run build`, and `pnpm exec wrangler deploy` publishes only `.output/public`. `vp run build` refreshes `.musubi/notion-data-snapshot/` through `vp run notion:setup`, then runs the same local static build and artifact checks exposed as `vp run check:build`. Production never serves `.output/server`, a Nitro process, a Notion API route, the Notion Data snapshot, or browser-side Notion credentials.

The repository pins Node through `.node-version`, pnpm through `packageManager`, and Wrangler as a development dependency. Configure the Worker build with production branch `v2`, build command `pnpm run build`, deploy command `pnpm exec wrangler deploy`, and `PNPM_VERSION=11.14.0`. `NODE_VERSION=24.18.0` may also be set explicitly as a redundant build-image guard.

Configure these values as Workers Builds variables or secrets, not Worker runtime bindings:

- `NOTION_TOKEN`
- `NOTION_DB_PAGE_ID`
- `NOTION_CONFIG_PAGE_ID`

Use a dedicated read-only Notion integration for routine production builds. Musubi does not require a write-capable Notion credential. Non-production branch builds remain disabled initially; if enabled later, they should run `vp run check:build` from the tracked snapshot without receiving Notion credentials.

The default cloud build uses the complete open-licensed LXGW fallback. `vp run font:setup` remains an optional private local or trusted-builder step; raw Tsanger files and the ignored `.musubi/font/` cache must never become deployment artifacts.

The snapshot keeps remote Notion image and file URLs unchanged; production does not copy those media into the artifact. An X embed keeps only its source URL and renders as a safe ordinary link. Neither `vp run notion:setup` nor the static build requests X oEmbed data or loads X's browser widget script.

Local development and verification use the tracked snapshot without Notion access:

```sh
vp run dev
vp run check:build
vp run ready
```

Run `vp run notion:setup` when the checked-in snapshot should be refreshed independently of a production build. Commit its per-page JSON changes with the corresponding source change when the repository should retain that revision.

## Publishing

The first Cloudflare deployment is created without attaching `musubi.hyf.me`:

1. Push the prepared commit to `v2`.
2. Let Workers Builds publish the `musubi` Worker to its `workers.dev` URL.
3. Verify Home, Blog, a Post, slashless canonical routes, the visible 404 response, fonts, themes, and cache headers.
4. Record the existing Vercel DNS target and deployment ID, then attach `musubi.hyf.me` as the Worker Custom Domain.
5. Verify the same surfaces on the custom domain before retiring the Vercel fallback.

Notion-only changes use the smallest explicit trigger:

1. Publish the intended rows in Notion.
2. Retrigger the production build for the current `v2` commit in Workers Builds.
3. Verify the changed route and one direct hard refresh at `https://musubi.hyf.me`.

This trigger deliberately remains manual. Automatic Notion webhooks can be added later only when their operational value justifies another credential and failure path.

## Deployment rollback

For an application or content regression after the cutover, roll the Worker back to the preceding successful version. During the migration observation period, a Cloudflare access or routing failure can instead be reversed by removing the Worker Custom Domain and restoring the recorded Vercel DNS target. Keep the Vercel project until the Cloudflare deployment has remained healthy for the chosen observation period.

If the problem came from content, correct or revert it in Notion and rebuild. The tracked Notion Data snapshot can reproduce the prior state locally with `vp run check:build`; rolling back a deployment never writes to Notion.

## Static delivery contract

`wrangler.jsonc` deliberately has no `main`, assets binding, or `nodejs_compat` flag. It serves `.output/public`, maps unmatched navigation to the generated `404.html`, and preserves Musubi's slashless canonical URLs. `public/_headers` preserves the production HSTS policy, gives content-addressed Nuxt assets and WOFF2 files a one-year immutable browser policy, prevents `workers.dev` preview URLs from being indexed, and leaves HTML plus stable generated metadata on Cloudflare's default revalidation behavior. Never put mutable content behind an immutable URL.