# Gotchas

Traps already paid for in this repository. Each entry states what not to do, why, and what would make the trap obsolete.

## Nuxt dev warnings with Vite+ (`NUXT_B5004`, `NUXT_B2005`)

- **Do not** delete root `vite.config.ts`, move Vite+ `fmt` / `lint` / `staged` / `run.tasks` into `nuxt.config` `vite`, or open work to "fix" these two messages on their own.
- **`NUXT_B5004` (external `vite.config.ts`):** Nuxt 4.5 warns that standalone bundler configs are unsupported and suggests merging into `nuxt.config`. Musubi's root `vite.config.ts` is the Vite+ toolchain file (tasks, fmt, lint, staged hooks), not Nuxt's Vite builder config. Nuxt maintainers document that Vite+ **requires** a separate `vite.config.ts` and does **not** work under `nuxt.config` `vite`; the warning is expected coexistence noise. Real Vite builder options still belong only under `nuxt.config` `vite`. Evidence: [NUXT_B5004](https://nuxt.com/docs/4.x/errors/b5004), [nuxt#34857](https://github.com/nuxt/nuxt/discussions/34857).
- **`NUXT_B2005` (`check-if-page-unused` has no default export):** False positive on Nuxt's own pages plugin in `4.5.0`. The compiled file uses `export { plugin as default, ... }`; export detection missed multi-export default re-exports. Fixed upstream in [nuxt#35676](https://github.com/nuxt/nuxt/pull/35676) (issue [nuxt#35664](https://github.com/nuxt/nuxt/issues/35664)); expect the warning to disappear on a Nuxt patch/nightly that includes that fix—not via project plugins or `pnpm patch` unless something forces it.
- **Ruling until then:** ignore both in dev logs; do not treat them as blockers for `dev`, `site:build`, or review.

## Global CSS path under Nuxt 4 `app/` + Vite 8

- **Do not** list app CSS as `./app/assets/...` in `nuxt.config` `css`.
- With default Nuxt 4 layout, `srcDir` is `app/`, and `~/` / `@/` alias to that directory. Prefer `~/assets/css/main.css`. Relative `./app/...` paths are written into `virtual:nuxt:.nuxt/css.mjs` and fail to resolve under Vite 8 (`Failed to resolve import "./app/assets/css/main.css"`), so HTML can still SSR while main site styles 404.

## UnoCSS preflight removes link underlines

- **Do not** style reading links with only `text-decoration-color` / thickness / offset and assume a browser default underline remains.
- UnoCSS (Tailwind-style) base layer sets `a { color: inherit; text-decoration: inherit }`, so links inherit “no underline” from ordinary text. Prose links then look like brand-colored `strong` (color only).
- **Ruling:** Explicitly set `text-decoration-line: underline` (plus the approved 1px / 3px / 42% brand resting underline) on reading links; keep chrome links (`site-brand`, nav, heading anchors, TOC, files) on `text-decoration: none`.

## Notion Markdown block boundaries vs CommonMark

- **Do not** assume Notion Page-as-Markdown already has CommonMark block separation. Notion joins adjacent blocks with a single `\n`; soft breaks inside one block are exported as `<br>`, not bare newlines.
- Without preprocess blank lines, CommonMark merges adjacent paragraphs (soft break), turns `paragraph\n---` into a setext H2 (divider disappears), absorbs following prose into the previous list item, and lazy-continues a following paragraph into a blockquote.
- **Ruling:** `preprocessNotionMarkdown` runs `separateNotionBlockBoundaries` after empty-block and void-tag rewrites. It inserts a blank line between non-empty lines except inside fenced code, tight lists (including nested items and indented continuations), multi-line blockquotes, and table row sequences.
- **Residual:** Two adjacent _separate_ Notion quote blocks still look like one multi-line quote in the export (`>\n>`), so they remain one quote after preprocess. Fixing that needs block-structure data the Page-as-Markdown string does not provide.