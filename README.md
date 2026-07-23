# Musubi / 結縄

<p align="center"><i>Tie your thoughts, publish them quietly.</i></p>

Musubi is an opinionated personal website built around Notion. Posts, standalone pages, and public site settings are written in Notion, then rendered by Void Framework and Vue into a static website.

It is deliberately small: a recent-post Home, a chronological Blog, individual Posts, and standalone Pages. Musubi is not a general-purpose CMS, a plugin system, or a hosted publishing service.

## How it works

```text
Notion → production build → Void + Vue → static HTML and page JSON → Cloudflare Workers Static Assets
```

`pnpm build` refreshes the content from Notion before generating the site. For faster local development and checks, the repository keeps a local snapshot in `.musubi/notion-data-snapshot/`; `pnpm dev` and `vp run site:build` read that snapshot instead of calling Notion. The deployed site contains no Notion token, live content database, application server, or runtime rendering Worker.

Void generates both the initial HTML and matching page data. Readers receive ordinary static documents on the first visit, while site-owned navigation can load the corresponding JSON without reloading the whole document.

## Local development

With [Vite+](https://viteplus.dev/guide/) installed, install the dependencies and start the site from the included local snapshot:

```sh
vp install
pnpm dev
```

The development server runs at `http://localhost:5173`.

Build and inspect the same static artifact that Cloudflare receives:

```sh
vp run site:build
pnpm preview
```

The static preview runs at `http://127.0.0.1:4173` and serves only `dist/client`.

Run the complete repository check before publishing a change:

```sh
vp run ready
```

## Project documentation

- [Project context](./.agents/docs/README.md) — intent, architecture, technology choices, known traps, and pending work
- [Visual design](./.agents/docs/DESIGN.md) — the site’s visual and interaction contract
- [Font sources and licenses](./licenses/fonts/README.md) — typography inputs, generated subsets, fallback delivery, and third-party terms

## License

Musubi’s source code is available under the [MIT License](./LICENSE). Font files and generated font derivatives remain subject to their respective licenses and terms.