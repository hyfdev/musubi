# Production Operations

Musubi's maintained example is deployed at `https://musubi.hyf.me` from the existing Vercel project named `musubi`. The separate `hyf.me` Vercel project uses different personal-site content and is not a Musubi example deployment target.

## Build contract

Vercel installs the pinned pnpm dependencies, runs `pnpm run build`, and serves only `.output/public`. `vp run build` refreshes `.musubi/notion-data-snapshot/` through `vp run notion:setup`, then runs the same local static build and artifact checks exposed as `vp run check:build`. Production never serves `.output/server`, a Nitro process, a Notion API route, the Notion Data snapshot, or browser-side Notion credentials.

Configure the following values independently for Vercel's Preview and Production environments:

- `NOTION_TOKEN`
- `NOTION_CONTENT_DATA_SOURCE_ID`
- `NOTION_CONFIG_DATA_SOURCE_ID`

Use a dedicated read-only Notion integration for routine Vercel builds. Musubi does not require a write-capable Notion credential.

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

Code changes use the existing Git integration:

1. Push the prepared commit to `v2`.
2. Verify the `musubi` Preview deployment.
3. Promote that Preview deployment to Production in Vercel. Vercel rebuilds it with the Production environment before assigning `musubi.hyf.me`.

Notion-only changes use the smallest explicit trigger:

1. Publish the intended rows in Notion.
2. In the Vercel `musubi` project, redeploy the current production source without reusing the prior build cache.
3. Verify the changed route and one direct hard refresh at `https://musubi.hyf.me`.

This trigger deliberately remains manual in the initial release. Automatic Notion webhooks can be added later only when their operational value justifies another credential and failure path.

## Deployment rollback

Before promotion, record the current production deployment URL and ID. If the new site is unhealthy, use Vercel Instant Rollback for the `musubi` project to reassign `musubi.hyf.me` to that previous successful production deployment. This restores the prior static artifact without rebuilding it.

If the problem came from content, correct or revert it in Notion and redeploy. The tracked Notion Data snapshot can reproduce the prior state locally with `vp run check:build`; rolling back a deployment never writes to Notion.

## Cache contract

Vercel serves `_nuxt` assets and generated content-addressed WOFF2 files with a one-year immutable policy. HTML, `fonts.css`, `fonts-manifest.json`, the OFL notice, `robots.txt`, and other stable URLs retain Vercel's revalidation behavior. Never put mutable content behind an immutable URL.