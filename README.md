<p align="center"><i>Tie your thoughts, publish them quietly.</i></p>

# Musubi / 結縄

Musubi is Yunfei's opinionated personal website framework. Notion is the editing surface; a dedicated setup step records its data as local JSON, then Nuxt and Vue validate and typeset that snapshot into a static site.

## Use a fork

You do not need to change source code or create a local website configuration file for the default site. An ordinary `.env.local` stores only the build secret and the two Notion source locators; optional private build inputs such as an alternate font-cache directory may also be set there.

1. Fork this repository.
2. Create or duplicate a Notion workspace that follows the [Database and Config contract](./docs/notion-workspace.md).
3. Create a dedicated Notion internal integration with only `Read content`, then share the workspace root with it.
4. Copy `.env.example` to `.env.local` and fill the token plus both Notion page IDs.
5. Install, fetch the first Notion Data snapshot, and verify the site through Vite+:

```sh
vp install
vp run notion:setup
vp run ready
```

`vp run notion:setup` is the only content command that contacts Notion. It writes the tracked snapshot as `.musubi/notion-data-snapshot/config.json` plus one `.musubi/notion-data-snapshot/pages/<notion-page-id>.json` file per Published page. Unchanged pages are reused on later refreshes. `vp run dev`, `vp run check:build`, and `vp run ready` consume those files locally and do not contact Notion. `vp run build` refreshes the snapshot first and then performs the same checked static build used by `vp run check:build`.

The deployable artifact is `.output/public`. It does not need `.output/server`, a running Nitro process, Notion credentials, or a public content API.

Production deployment, publication, cache, and rollback procedures are documented in [Production Operations](./docs/production.md).

## Optional Tsanger typography

Musubi works without proprietary font files: an ordinary install and build use the open-licensed `Musubi CJK Fallback`. To opt this checkout into the preferred Tsanger JinKai W04/W05 typography, review the linked font terms and run:

```sh
vp run font:setup
```

The command downloads the two pinned files directly from `tsanger.cn`, verifies their size and SHA-256, and stores them only in the ignored `.musubi/font/tsanger/` directory. Later builds discover that private cache automatically and publish only content-derived WOFF2 subsets. It is never run automatically by `vp run build`, `vp run ready`, installation, or the public repository.

If you intentionally opt a trusted cloud builder into Tsanger, run `vp run font:setup` before `vp run build`; cache `.musubi/font/` only inside that trusted deployment job if the provider supports private build caches, and never upload the complete sources as public artifacts. `MUSUBI_TSANGER_CACHE_DIR` can point both commands at another private Tsanger cache directory. Existing licensed local files can instead be supplied through the paired `MUSUBI_TSANGER_W04_PATH` and `MUSUBI_TSANGER_W05_PATH` overrides. Run `vp run font:setup -- --clear` to remove the optional Tsanger checkout cache and return to fallback-only builds.

## Local visual loop

Start Nuxt against the tracked local Notion Data snapshot:

```sh
vp run dev
```

Development reads only the tracked Notion Data snapshot. It also prepares the generated font files from local inputs; a private `.musubi/font/build-state.json` fingerprint makes unchanged starts reuse the existing output instead of rebuilding fonts.

Build from the same local snapshot and serve only the static artifact:

```sh
vp run check:build
vp run preview -- --port 4173
```

The static preview mirrors the production cache contract: HTML and stable metadata URLs revalidate with `ETag` and `Last-Modified`, while content-addressed Nuxt assets, generated files, and font subsets use a one-year immutable policy. A deployment host should preserve the same distinction.

`vp run lint` runs Vite+'s code lint and Google's official `designmd lint DESIGN.md` together. `vp run ready` includes that repository lint task alongside formatting, focused unit tests, Nuxt's Vue-aware type check, local snapshot validation, static generation, and artifact checks. User-facing changes additionally require the real-browser workflow in [Visual Frontend Development and Acceptance](./.agents/docs/visual-frontend-development-and-acceptance.md).

## Content behavior

- Published Posts become `/blog/:slug`; Published Pages become `/:slug`.
- A Published Page enters primary navigation only when its Notion row explicitly enables `Show in Navigation`; a hidden Page remains directly routable.
- `/` shows the five newest Posts; `/blog` shows every published Post in one archive grouped by year.
- Drafts, tag routes, paginated Blog routes, and a public content API are not generated.
- Notion Markdown is parsed into Musubi's allowlisted AST and rendered by Vue templates. Raw HTML and executable MDX are rejected.
- Notion images and file blocks retain their remote HTTPS URLs; Musubi does not download or rewrite them in the initial architecture. An X embed stores only its source URL and renders as a safe ordinary link without build-time oEmbed requests or browser widget loading.
- Tsanger JinKai W04 and W05 are accepted as optional local build inputs and are subset by body-versus-emphasis usage when supplied. Preferred subsets and the public LXGW WenKai GB Medium fallback use content-addressed WOFF2 URLs; the fallback preserves every mapped source code point across Unicode-range shards that also cover later runtime text.
- Light and warm dark themes follow the system by default; a persisted three-choice control selects Light, Dark, or System directly.

The durable product boundary is documented in [Project Context Records](./.agents/docs/README.md), and the exact visual direction lives in [DESIGN.md](./DESIGN.md).