# Production Operations

Musubi's maintained example is deployed at `https://musubi.hyf.me` from the existing Vercel project named `musubi`. The separate `hyf.me` Vercel project uses different personal-site content and is not a Musubi example deployment target.

## Build contract

Vercel installs the pinned pnpm dependencies, runs `pnpm run build`, and serves only `.output/public`. The production task prepares the current Notion state, generates the complete static site, finalizes the 404 document, and verifies the artifact before Vercel can publish it. Production never serves `.output/server`, a Nitro process, a Notion API route, or browser-side Notion credentials.

Configure the following values independently for Vercel's Preview and Production environments:

- `NOTION_TOKEN`
- `NOTION_CONTENT_DATA_SOURCE_ID`
- `NOTION_CONFIG_DATA_SOURCE_ID`

Use a dedicated read-only Notion integration for routine Vercel builds. The broader credential used by `vp run notion:migrate` is a one-time migration input and does not belong in Vercel.

The default cloud build uses the complete open-licensed LXGW fallback. `vp run font:setup` remains an optional private local or trusted-builder step; raw Tsanger files and `.musubi/font-inputs` must never become deployment artifacts.

During content preparation, each supported X status URL may make one bounded request to the fixed official `https://publish.x.com/oembed` endpoint. This request uses no X API token. A timeout, provider error, oversized response, or invalid response does not fail the site build; that embed is emitted as a safe ordinary link and the rest of the article continues. A successfully enriched page contains its complete static quotation in generated HTML. Musubi's lightweight interaction script loads `https://platform.x.com/widgets.js` only when enriched X markup is present, without requiring the Nuxt client runtime, so readers of that page make third-party X requests even with the widget's data-non-use option enabled.

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

## Content schema migration

Preview the repeatable migration plan:

```sh
vp run notion:migrate -- --draft-page=about
```

Apply it:

```sh
vp run notion:migrate -- --apply --draft-page=about
```

The command first verifies that the selected Config source belongs to `musubi.hyf.me`, saves a private mode-`0600` snapshot below `.musubi/notion-migrations/`, then adds `Page` while retaining legacy `Content`, adds the navigation fields, migrates legacy rows, keeps the example About Page as Draft, and records an explicit `Asia/Singapore` Config row. It rereads and verifies the complete affected sources after writing.

To restore the prior schema and affected rows:

```sh
vp run notion:migrate -- --rollback=.musubi/notion-migrations/<snapshot>.json
```

The rollback command takes another private snapshot before restoring the original row values and select options. It removes migration-created schema fields and trashes only a Config row that the migration itself created.

## Deployment rollback

Before promotion, record the current production deployment URL and ID. If the new site is unhealthy, use Vercel Instant Rollback for the `musubi` project to reassign `musubi.hyf.me` to that previous successful production deployment. This restores the prior static artifact without rebuilding it.

If the problem came from the Notion migration, run the snapshot rollback command above and then redeploy the restored source. Code rollback and Notion rollback are separate operations so either side can be recovered without changing the other unnecessarily.

## Cache contract

Vercel serves `_nuxt` assets, generated content-addressed assets, and generated WOFF2 files with a one-year immutable policy. HTML, `fonts.css`, `fonts-manifest.json`, the OFL notice, `robots.txt`, and other stable URLs retain Vercel's revalidation behavior. Never put mutable content behind an immutable URL.