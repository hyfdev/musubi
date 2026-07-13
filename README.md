<p align="center"><i>Tie your thoughts, publish them quietly.</i></p>

# Musubi / 結縄

Musubi is Yunfei's opinionated personal website framework. Notion is the editing surface; each build validates the complete source, typesets it with Nuxt and Vue, and emits a static site.

## Use a fork

You do not need to change source code or create a local website configuration file for the default site. `.env.local` stores only the build secret and the two Notion source locators.

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

## Local visual loop

Prepare the current Notion content and start Nuxt development:

```sh
vp run visual:dev
```

After generation, serve only the static artifact:

```sh
vp run visual:static -- --port 4173
```

Musubi intentionally has no automated test suite. `vp run ready` runs formatting, linting, Nuxt's Vue-aware type check, live content preparation, static generation, and artifact checks. User-facing changes additionally require the real-browser workflow in [Visual Frontend Development and Acceptance](./.agents/docs/visual-frontend-development-and-acceptance.md).

## Content behavior

- Published Posts become `/blog/:slug`; Published Content pages become `/:slug`.
- `/` is the first chronological article index and later pages begin at `/blog/page/2`.
- Drafts, tag routes, `/blog/page/1`, and a public content API are not generated.
- Notion Markdown is parsed into Musubi's allowlisted AST and rendered by Vue templates. Raw HTML and executable MDX are rejected.
- Required remote images and Notion file blocks are copied into stable generated assets. X embeds become non-interactive link cards.
- Luo is self-hosted, and each build generates a renamed matching font subset only for current public glyphs Luo lacks.
- Light and warm dark themes follow the system by default and can be selected explicitly.

The durable product boundary is documented in [Project Context Records](./.agents/docs/README.md), and the exact visual direction lives in [DESIGN.md](./DESIGN.md).