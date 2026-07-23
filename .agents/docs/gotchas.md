# Gotchas

Traps already paid for in this repository. Each entry states what not to do, why, and what would make the trap obsolete.

## Void 0.10.10 needs a direct `pathe` dependency

- **Do not** remove direct `pathe@2.0.3` merely because Musubi source does not import it.
- Void's published prerender runner imports `pathe` at runtime, but `void@0.10.10` does not carry it in the package dependency graph. Strict pnpm therefore fails during prerender unless the application supplies it.
- **Ruling:** Keep the direct dependency until a published Void release includes the fix for [void#285](https://github.com/voidzero-dev/void/issues/285), then remove it only after a clean install and full static build pass without it.

## Void prerender failures do not necessarily fail the build

- **Do not** treat a zero exit from `vp build` as proof that every requested static route exists.
- Void 0.10.10 logs an individual prerender failure and can still finish the top-level build successfully. Musubi requires complete publication, so a missing page cannot be a warning.
- **Ruling:** `scripts/verify-static-artifact.mjs` independently requires one flat HTML file and one matching `/_void/pages/*.json` file for every validated route, plus the 404 pair. Keep this gate after every Void build.

## Void source-directory conventions are active at the configured root

- **Do not** leave a second root-level `pages/` or `middleware/` directory when `void.json` sets `sourceDir` to `app`.
- Even an empty convention directory at the wrong root can change project discovery or produce a conflicting structure. Application pages and middleware live only under `app/`; build-time snapshot code remains under `server/site/` because it is imported explicitly.

## Static generation runs loaders more than once

- Void generates both route HTML and page JSON, so the loader for a prerendered path normally runs once for each representation.
- **Ruling:** Loaders and global middleware may read deterministic local state but must not perform one-shot mutations, fetch Notion, or rely on one execution per route. `getSite()` caches the parsed production `Site` per process so repeated representation requests do not repeatedly parse the snapshot.

## Known non-fatal Void and Node messages

- Void 0.10.10 currently warns that `renderPreambleScript` has no matching export and that `serveStatic` cannot find `./client` while the build is moving from SSR output to prerendered client output. The required `dist/client` files are still emitted and verified.
- Node 24 may also report `es-module-lexer`'s `lexer.asm.js` as invalid asm.js. It falls back to ordinary JavaScript and has not changed dev, type-check, test, or build results.
- **Ruling:** Do not patch dependencies merely to silence these messages. Re-evaluate them on a Void upgrade or if a verified output or runtime failure accompanies one.

## Visible 404 in Node development

- Void 0.10.10's Node dev server has no generated `404.html` asset before a build. An unknown page therefore has an empty 404 response even though `app/pages/404.vue` exists; forcing an HTML body onto that 404 is stripped by the dev adapter.
- **Ruling:** Development-only middleware rewrites unknown document paths to the real `/404` page so the recovery UI remains testable; that dev response is 200. The production artifact still contains `404.html`, and Cloudflare's `not_found_handling: "404-page"` returns it with status 404. Remove the rewrite if a future Void version serves the component with a real 404 in dev.

## UnoCSS preflight removes link underlines

- **Do not** style reading links with only `text-decoration-color` / thickness / offset and assume a browser default underline remains.
- UnoCSS (Tailwind-style) base layer sets `a { color: inherit; text-decoration: inherit }`, so links inherit “no underline” from ordinary text. Prose links then look like brand-colored `strong` (color only).
- **Ruling:** Explicitly set `text-decoration-line: underline` (plus the approved 1px / 3px / 42% brand resting underline) on reading links; keep chrome links (`site-brand`, nav, heading anchors, TOC, files) on `text-decoration: none`.

## Notion Markdown block boundaries vs CommonMark

- **Do not** assume Notion Page-as-Markdown already has CommonMark block separation. Notion joins adjacent blocks with a single `\n`; soft breaks inside one block are exported as `<br>`, not bare newlines.
- Without preprocess blank lines, CommonMark merges adjacent paragraphs (soft break), turns `paragraph\n---` into a setext H2 (divider disappears), absorbs following prose into the previous list item, and lazy-continues a following paragraph into a blockquote.
- **Ruling:** `preprocessNotionMarkdown` runs `separateNotionBlockBoundaries` after empty-block and void-tag rewrites. It inserts a blank line between non-empty lines except inside fenced code, tight lists (including nested items and indented continuations), multi-line blockquotes, and table row sequences.
- **Residual:** Two adjacent _separate_ Notion quote blocks still look like one multi-line quote in the export (`>\n>`), so they remain one quote after preprocess. Fixing that needs block-structure data the Page-as-Markdown string does not provide.