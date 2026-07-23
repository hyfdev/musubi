<p align="center"><i>Tie your thoughts, publish them quietly.</i></p>

# Musubi / 結縄

Musubi is Yunfei's opinionated personal website framework. Notion is the editing surface; a dedicated setup step records its data as local JSON, then Void Framework and Vue validate and typeset that snapshot into a static site.

## Font setup

Musubi self-hosts content-derived Charter and JetBrains Mono subsets so English and code typography do not depend on fonts installed on the reader's device. `font:setup` downloads and verifies the pinned open-licensed WOFF2 sources into the ignored `.musubi/font/latin/` cache; the public build includes only generated content-addressed subsets and the required licenses.

Preferred Tsanger JinKai W04/W05 sources are also never committed: `font:setup` downloads and verifies them into the ignored `.musubi/font/tsanger/` cache and skips the download when a verified cache already exists. Default download order is jsDelivr (`cdn.jsdelivr.net/gh/tw93/Kami@main/assets/fonts/…`), then the official `tsanger.cn` hosts; checksums must match the pinned pair.

The default pipeline runs `vp run font:setup` so install, dev, and site builds prepare all required source files. A missing Charter or JetBrains Mono source is always restored or fails clearly. `MUSUBI_TSANGER_SETUP=0` skips only the Tsanger download attempt; an existing cache or paired `MUSUBI_TSANGER_*_PATH` files still feed `font:build`. To force a fallback-only Chinese build, clear the Tsanger cache (`vp run font:setup -- --clear`) and keep its setup skipped or leave no local sources.

- `postinstall` — `font:setup` after `void prepare`
- `pnpm run dev` / `vp run site:build` — `font:setup` before `font:build`
- `pnpm run build` — `notion:setup` then `site:build`

`font:build` only reads the on-disk Notion snapshot and verified font caches or Tsanger path overrides; it does not call Notion itself. Review the official terms before using Tsanger. Full source files must never become public deployment artifacts.

Builder-only environment (do not commit secrets or private mirror URLs):

- `MUSUBI_TSANGER_W04_URL` / `MUSUBI_TSANGER_W05_URL` — paired HTTPS mirrors; files must match the pinned size and SHA-256
- `MUSUBI_TSANGER_W04_PATH` / `MUSUBI_TSANGER_W05_PATH` — paired local source files for `font:build`
- `MUSUBI_TSANGER_CACHE_DIR` — alternate setup cache directory
- `MUSUBI_TSANGER_SETUP=0` — skip setup download (does not clear an existing cache)

Manual: `vp run font:setup`, `vp run font:setup -- --clear`.

## Local visual loop

Start Void against the tracked local Notion Data snapshot:

```sh
pnpm run dev
```

Development reads only the tracked Notion Data snapshot. It also prepares the generated font files from local inputs; a private `.musubi/font/build-state.json` fingerprint makes unchanged starts reuse the existing output instead of rebuilding fonts.

Build from the same local snapshot and serve only the static artifact:

```sh
vp run site:build
pnpm run preview -- --port 4173
```

The static preview mirrors the production cache contract: HTML, Void page JSON, and stable metadata URLs revalidate with `ETag` and `Last-Modified`, while content-addressed Void assets, generated files, and font subsets use a one-year immutable policy. A deployment host should preserve the same distinction.

`vp run lint` runs Vite+'s code lint and Google's official `designmd lint .agents/docs/DESIGN.md` together. `vp run ready` includes that repository lint task alongside formatting, focused unit tests, Void's Vue-aware application type check, an independent strict TypeScript check for Notion and font tooling plus root build configuration, local snapshot validation, static generation, and artifact checks. User-facing changes additionally require the real-browser workflow in [Visual Frontend Development and Acceptance](./.agents/docs/visual-frontend-development-and-acceptance.md).

## Content behavior

- Published Posts become `/blog/:slug`; Published Pages become `/:slug`.
- A Published Page enters primary navigation only when its Notion row explicitly enables `Show in Navigation`; a hidden Page remains directly routable.
- `/` shows the five newest Posts; `/blog` shows every published Post in one archive grouped by year.
- Drafts, tag routes, paginated Blog routes, and a public content API are not generated.
- Notion Markdown is parsed into Musubi's allowlisted AST and rendered by Vue templates. Raw HTML and executable MDX are rejected.
- Notion images and file blocks retain their remote HTTPS URLs; Musubi does not download or rewrite them in the initial architecture. An X embed stores only its source URL and renders as a safe ordinary link without build-time oEmbed requests or browser widget loading.
- Tsanger JinKai W04 and W05 are accepted as optional local build inputs and receive the same complete build-known Chinese corpus when supplied; their visual body-versus-emphasis roles remain distinct. Charter and JetBrains Mono are self-hosted from pinned sources. All public faces and the font stylesheet use content-addressed URLs. Every build also publishes the complete CJK-only `Musubi CJK Fallback` pool derived from LXGW WenKai GB Medium; its exact `unicode-range` shards exclude ASCII and ordinary Latin and are downloaded only when Tsanger lacks a rendered Chinese character, including Chinese introduced after the build.
- Light and warm dark themes follow the system by default; a persisted three-choice control selects Light, Dark, or System directly.

The durable product boundary is documented in [Project Context Records](./.agents/docs/README.md), and the exact visual direction lives in [DESIGN.md](./.agents/docs/DESIGN.md).