<p align="center"><i>Tie your thoughts, publish them quietly.</i></p>

# Musubi / 結縄

Musubi is Yunfei's opinionated personal website framework. Notion is the editing surface; each build validates the complete source, typesets it with Nuxt and Vue, and emits a static site.

## Use a fork

You do not need to change source code or create a local website configuration file for the default site. An ordinary `.env.local` stores only the build secret and the two Notion source locators; optional private build inputs such as an alternate font-cache directory may also be set there.

1. Fork this repository.
2. Create or duplicate a Notion workspace that follows the [Content and Config contract](./docs/notion-workspace.md).
3. Create a dedicated Notion internal integration with only `Read content`, then share the workspace root with it.
4. Copy `.env.example` to `.env.local` and fill the token plus both data-source IDs.
5. Install and generate through Vite+:

```sh
vp install
vp run ready
```

The deployable artifact is `.output/public`. It does not need `.output/server`, a running Nitro process, Notion credentials, or a public content API.

Production deployment, publication, cache, migration, and rollback procedures are documented in [Production Operations](./docs/production.md).

## Optional Tsanger typography

Musubi works without proprietary font files: an ordinary install and build use the open-licensed `Musubi CJK Fallback`. To opt this checkout into the preferred Tsanger JinKai W04/W05 typography, review the linked font terms and run:

```sh
vp run font:setup
```

The command downloads the two pinned files directly from `tsanger.cn`, verifies their size and SHA-256, and stores them only in the ignored `.musubi/font-inputs/` directory. Later builds discover that private cache automatically and publish only content-derived WOFF2 subsets. It is never part of `vp run build`, `vp run ready`, installation, or the public repository.

For a clean cloud builder, run `vp run font:setup` before `vp run build`; cache `.musubi/font-inputs/` only inside a trusted deployment job if the provider supports private build caches, and never upload the complete sources as public artifacts. `MUSUBI_TSANGER_CACHE_DIR` can point both commands at another private cache directory. Existing licensed local files can instead be supplied through the paired `MUSUBI_TSANGER_W04_PATH` and `MUSUBI_TSANGER_W05_PATH` overrides. Run `vp run font:setup -- --clear` to remove the checkout cache and return to fallback-only builds.

## Local visual loop

Prepare the current Notion content and start Nuxt development:

```sh
vp run visual:dev
```

After generation, serve only the static artifact:

```sh
vp run visual:static -- --port 4173
```

The static preview mirrors the production cache contract: HTML and stable metadata URLs revalidate with `ETag` and `Last-Modified`, while content-addressed Nuxt assets, generated files, and font subsets use a one-year immutable policy. A deployment host should preserve the same distinction.

`vp run lint` runs Vite+'s code lint and Google's official `designmd lint DESIGN.md` together. `vp run ready` includes that repository lint task alongside formatting, focused unit tests, Nuxt's Vue-aware type check, live content preparation, static generation, and artifact checks. User-facing changes additionally require the real-browser workflow in [Visual Frontend Development and Acceptance](./.agents/docs/visual-frontend-development-and-acceptance.md).

## Content behavior

- Published Posts become `/blog/:slug`; Published Pages become `/:slug`.
- A Published Page enters primary navigation only when its Notion row explicitly enables `ShowInNavigation`; a hidden Page remains directly routable.
- `/` shows the five newest Posts; `/blog` shows every published Post in one archive grouped by year.
- Drafts, tag routes, paginated Blog routes, and a public content API are not generated.
- Notion Markdown is parsed into Musubi's allowlisted AST and rendered by Vue templates. Raw HTML and executable MDX are rejected.
- Required remote images and Notion file blocks are copied into stable generated assets. A supported X post is enriched at build time into a safe static quotation, then enhanced in the browser with X's official widget when it loads; provider failure remains local to the embed and preserves a usable link.
- Tsanger JinKai W04 and W05 are accepted as optional local build inputs and are subset by body-versus-emphasis usage when supplied. Preferred subsets and the public LXGW WenKai GB Medium fallback use content-addressed WOFF2 URLs; the fallback preserves every mapped source code point across Unicode-range shards that also cover later runtime text.
- Light and warm dark themes follow the system by default; a persisted three-choice control selects Light, Dark, or System directly.

The durable product boundary is documented in [Project Context Records](./.agents/docs/README.md), and the exact visual direction lives in [DESIGN.md](./DESIGN.md).