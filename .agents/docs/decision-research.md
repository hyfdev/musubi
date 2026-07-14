# Autonomous Decision Research

## Status and purpose

Yunfei reviewed the decision packet on 2026-07-12 and selected the product, Notion editing and onboarding, configuration, routing and navigation, static-publication, Markdown, site-settings failure, light/dark theme, and Chinese-font boundaries recorded below. Follow-up research closed the factual `notion-to-md` comparison, verified a Node/WebAssembly implementation path for the selected generated font fallback, and audited the supplied Notion sources plus the working `hyf.me` routes. No product or architecture preference remains open. This record retains evidence and alternatives; the goal, architecture, technology-stack, design, and acceptance records own current direction.

The initial research baseline is repository revision `e023e79`. Claims about that revision and its generated artifact are historical observations, not descriptions of the completed implementation.

## Explicit directions to preserve

These directions were explicitly selected in conversation and distilled into their owning records:

- Musubi is Yunfei's personal website framework. The documented ordinary-user fork-and-deploy path is a Yunfei-selected requirement; other ordinary-user needs are considered but do not block Yunfei-driven work or override his requirements.
- The target stack uses Nuxt 4, Vue 3 templates with `<script setup lang="ts">`, TypeScript, `vue-tsc`, UnoCSS with `presetWind4`, VueUse only for concrete needs, pnpm, and Vite+ as the development toolchain.
- Vite+ must not replace the upstream Vite used by Nuxt, and Vite Task plus `vp run` caching remains disabled.
- Musubi does not maintain an automated test suite; user-facing work requires real-browser visual acceptance.
- The overall blog style references Kami's white print one-pager and ships the inspected warm dark palette alongside the light theme.
- Luo is the first Chinese typeface. During generation, Musubi creates a matching `Musubi CJK Fallback` subset containing only current-corpus CJK characters, Chinese punctuation, and full-width symbols that the pinned Luo input lacks.
- The completed migration removes `nuxt-prerender-kit` and replaces its accepted prerender responsibilities with Nuxt-native build-only data routes and explicit static page generation.
- Ordinary users fork Musubi, duplicate its Notion template, grant a dedicated read-only internal integration access, provide `NOTION_TOKEN`, `NOTION_CONTENT_DATA_SOURCE_ID`, and `NOTION_CONFIG_DATA_SOURCE_ID`, and deploy without editing source or local configuration.
- Notion is the only canonical editing source for content and public site settings. The local site-config object exists only as an internal fallback.
- Musubi uses deployment-time SSG: each build fetches the Notion data used by that build and emits a static artifact. Automatic build triggering is deferred.
- The canonical routes are `/`, `/blog/page/:page` beginning at page 2, `/blog/:slug` for Posts, and `/:slug` for Content pages. Tags remain metadata and do not create routes; Content navigation is controlled and ordered in Notion.

If evidence conflicts with one of these directions, record the conflict for Yunfei rather than silently rewriting the direction or inventing a project goal that justifies it.

## Selected direction and final review

The initial numbered packet was a review device, not a permanent schema. Yunfei's answers are now written as project statements; rejected options remain only where their reason matters. The old global “which quality wins” question is withdrawn because it invented a conflict rather than describing a real Yunfei requirement.

### Selected source-distribution promise

Musubi is one opinionated Nuxt application distributed as source. An ordinary user forks it, duplicates the documented Notion template, creates a dedicated internal integration with only `Read content`, grants it access to the template root, supplies the three documented Notion environment variables, and deploys the complete default website without changing one line of source or a local configuration file.

This is stronger than merely making the repository forkable, but it is not an upgrade contract. Musubi does not promise a Nuxt layer, independently versioned packages, stable extension APIs, or painless rebasing of downstream source changes. Those alternatives were rejected because Yunfei expects the default fork itself to work without edits, not because ordinary-user needs become the project's driver.

### Withdrawn global-priority question

The earlier question asking Yunfei to rank personal changeability against publication stability was malformed. Yunfei did not provide two conflicting requirements, and Musubi can require both: the system follows Yunfei's changing needs, while required public content never disappears or corrupts silently. If a concrete future design cannot satisfy two named Yunfei requirements together, record that actual conflict and its consequences then; do not invent a permanent ranking now.

### Selected website surface

The default website contains a chronological article index at `/`, later index pages at `/blog/page/:page`, Posts at `/blog/:slug`, and Content pages at `/:slug`. Page 1 has only `/` as its canonical route. Tags remain optional metadata and create no route; projects, notes, talks, and arbitrary user-defined collections are not promised until a concrete Yunfei requirement names one.

Published slugs are explicit, not title-derived. Invalid or empty slugs, duplicate output routes, and conflicts with reserved generated routes fail generation. Published Content pages appear in navigation by default, can opt out with `ShowInNavigation`, and sort by `NavigationOrder` then title.

### Selected Notion ownership

Notion is the only canonical editing source for both content and public site settings. Git Markdown and a multi-source adapter platform are rejected target capabilities.

The earlier packet incorrectly combined this product decision with “official API.” Yunfei does not need to choose an API ideology. The completed technical comparison selected the current official page-as-Markdown and data-source APIs behind a private adapter; that conclusion is internal and does not become a public adapter contract.

### Selected Notion onboarding and editing model

The documented template owns one content data source and one key/value configuration data source under a shareable root. The ordinary-user default is a workspace-scoped internal integration with only `Read content`; personal tokens remain acceptable temporary development credentials but are not the product contract, and public OAuth is not selected. The three required environment variables are `NOTION_TOKEN`, `NOTION_CONTENT_DATA_SOURCE_ID`, and `NOTION_CONFIG_DATA_SOURCE_ID`.

The content source retains `Title`, `Slug`, `Date`, `Status`, `Type`, `Description`, and `Tags`. The target template also includes `ShowInNavigation` and `NavigationOrder`; its default Content page template sets the former to true and leaves the latter empty. A compatible source that omits those properties entirely uses visible and unordered as defaults. `Draft` and `Published` are the only status values; `Post` and `Content` are the only type values. Published rows require a title and slug, Published Posts also require a date, and Tags remain metadata only.

The configuration source retains `Description`, `Key`, `Value`, and `Enable`. Enabled rows are allowlisted and parsed into a private typed object rather than becoming an arbitrary configuration API. `Title`, `Description`, and `Author` are trimmed nonempty strings; `Link`, `GitHub`, and `X(Twitter)` are absolute HTTP(S) URL strings; `Lang` is a valid BCP 47 language tag; `Timezone` is a valid IANA time-zone identifier; `Since` is an integer calendar year from 1 through 9999; and `PostsPerPage` is a positive integer.

### Selected Markdown-first content direction

The first architecture uses Markdown for page bodies. Notion page metadata and public settings remain typed objects, while the official page-as-Markdown API supplies the body as documented Notion-flavored Markdown. Musubi parses that Markdown during generation into an internal syntax tree and renders the accepted nodes with Vue components.

The removed React/`react-notion-x` path was an expedient response to the lack of a mature Vue equivalent, not a product commitment. `notion-to-md` is not selected merely because its stable release returns Markdown: it builds that output through old block API types and silently skips unsupported blocks. The current official endpoint already returns a documented extended Markdown format and reports truncation and unknown block IDs.

A custom JSON block model is deferred rather than forbidden. Reopen it only when required content cannot be represented cleanly in the bounded Markdown dialect or the parser becomes more complicated than direct block normalization.

### Selected static publication

Musubi uses SSG. A deployment build fetches the latest Notion content and public site settings used by that build, creates the complete static artifact, and makes no browser-time Notion request. A deployed site does not require a Nitro server. Notion files with short-lived URLs must become stable generated assets.

Automatically triggering the next deployment when Notion changes is deliberately deferred; no webhook, polling, scheduled rebuild, or freshness promise is selected now. Hybrid rendering and runtime SSR are rejected for the initial architecture.

### Selected site-settings model

All public site settings and navigation inputs are authored in Notion. Identity, public links, locale, timezone, site age, and page size use allowlisted configuration rows; standalone-page navigation uses Content-row fields. The repository owns a typed ordinary default object only as fallback data. That object is not a public configuration feature, has no user-facing override API, and never needs editing in the default fork workflow.

Notion environment variables only locate and authenticate the content and settings sources. Build tooling, dependencies, deployment settings, and secrets are outside the public site-settings object.

Fallback is field-level: a missing optional Notion field uses the local default, while an invalid value or failure to load the authoritative Notion source fails the build. Silently falling back to an entirely local identity after a Notion failure is rejected because it could publish the wrong site.

### Selected dark theme

Musubi ships explicit light and warm dark themes, follows the system preference by default, and lets the reader select a theme. The inspected warm-charcoal canvas, warm neutral text and surfaces, pale ink-blue dark accent, visible focus treatment, and print-light rule are accepted target behavior. Later user-facing changes still require the recorded real-browser visual acceptance.

### Selected Luo missing-glyph fallback

Musubi pins and self-hosts one reviewed Luo input and the matching LXGW WenKai Screen base. Each deployment inventories every current-corpus CJK character, Chinese punctuation mark, and full-width symbol assigned to Chinese typography across generated Notion content, public settings, and application-owned text. Code points absent from Luo are extracted from the matching base into one deterministic WOFF2 named internally and in CSS as `Musubi CJK Fallback`.

The generator uses Node and WebAssembly tooling, so it adds no setup beyond the selected Notion onboarding workflow and does not require Python, native font tools, or a hand-maintained character list. The generated font retains source copyright and OFL metadata, ships the license, and replaces every `LXGW WenKai` Reserved Font Name occurrence in its identity records, including localized family, full, unique, and PostScript names. A required character absent from both pinned sources or a failed font generation stops the build.

Platform fallback was rejected because realistic prose visibly mixes unrelated type styles and varies by operating system. Shipping the complete matching fallback was rejected because the disposable WOFF2 was about 9.6 MiB. The historical 702-character generated subset was about 199 KiB, but that is evidence rather than a target size. The completed fixture build selected only U+00B7 and U+2014, neither covered by Luo, and emitted a 1,024-byte matching fallback; the generator repeats this inventory for each build rather than treating that measurement as a budget.

### Accepted default behavior

- When the production Yunfei content source is connected, preserve the five working article routes audited on `hyf.me`: `/blog/agent-skills-practice-vue-tsc-missing-components-en`, `/blog/agent-skills-practice-vue-tsc-missing-components`, `/blog/claude-code-in-rolldown-en`, `/blog/claude-code-in-rolldown`, and `/blog/graduation`. The supplied `musubi.hyf.me` data sources are iteration fixtures; do not make their demo slugs canonical or fabricate Yunfei pages that are absent from the fixture. The observed `/tags` destination already returns 404 and is not preserved as a working route.
- Draft or otherwise unpublished content is never publicly addressable, missing content returns 404, required route enumeration is explicit, and a required content or route failure fails generation.
- A failed optional embed is isolated to that embed and leaves the article readable. Unsupported required content reports the source and block instead of disappearing.
- In these records, an embed means third-party content displayed inside the article, such as a YouTube player, CodePen demo, Figma preview, or X post. It does not mean an ordinary link or a Notion-hosted image. The three X embeds found in the iteration source become non-interactive link cards without another UI runtime; other providers are added only by concrete need, and an unavailable provider degrades to an ordinary link or local placeholder.
- The initial content model is paragraphs, headings below the page title, ordered and unordered lists, links, images with captions and alternative text, code, quotes, callouts, dividers, tables, tasks, and a generated table of contents. Embeds are added only by name and remain isolated.
- Use typed BCP 47 locale and IANA timezone site settings rather than build-machine defaults. The Yunfei-site defaults are `en-SG` and `Asia/Singapore`.
- No public browser API is emitted merely because a build-only page fetch used a server API route. Every public static API is separately named, generated, content-typed, and accepted on the selected host.
- Do not invent a numeric performance budget from the prototype. The architecture must exclude unnecessary client runtimes and duplicate content representations, and implementation must record measured output.

### Architecture consequence

The selected system is one Nuxt application. At build time, a private Notion adapter uses the three server-only environment variables to normalize the selected content and key/value configuration sources, load Notion-flavored Markdown bodies, parse them into an internal syntax tree, and feed Vue-rendered static pages. The deployed site has no Notion client, credential, content-source adapter API, package boundary, runtime content server, or public configuration layer.

The technical recommendation is to use the current official Notion SDK, data-source APIs, and page-as-Markdown API only inside that adapter. The block API remains a targeted diagnostic or optional-content fallback when the Markdown response identifies an unknown block. `notion-to-md` is not recommended as a core dependency. This is an internal architecture conclusion rather than another user-facing choice.

### Record ownership after selection

- `goal.md` owns the selected outcome, surface, audience priority, success condition, qualities, non-goals, and deferred automatic deployment trigger.
- `architecture.md` owns the system boundary, input contracts, generation pipeline, routes, navigation, publication behavior, and failure semantics.
- `technology-stack.md` owns the selected technologies and non-default integration restrictions. Its selected section retains Yunfei's 2026-07-12 vouch.
- `DESIGN.md` owns the selected Kami-derived visual direction, light and warm dark tokens, typography, and responsive rules.
- `visual-frontend-development-and-acceptance.md` owns the no-test boundary and real-browser evidence requirements.
- `migration-plan.md` retains the completed repository-local implementation checklist and acceptance evidence.

## Research workstreams

| Workstream                               | Current state | Evidence required for closure                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prototype behavior and migration surface | Complete      | Every current route, visible state, configuration input, data responsibility, build/runtime dependency, and `usePrerenderData` path is mapped to exact source evidence without promoting it to a future requirement.                               |
| Vite+ reference convention               | Complete      | A timestamped disposable `vp create nuxt` project records versions, generated files, package-manager conventions, Vite replacement behavior, cache behavior, and the smallest Nuxt-safe adaptation.                                                |
| Native Nuxt prerender behavior           | Complete      | Disposable output proves the difference between build-only API data embedded in page payloads and public API routes emitted as static files, including pure-static serving behavior and known hosting caveats.                                     |
| Notion acquisition and Markdown          | Complete      | Stable and prerelease `notion-to-md`, the current official SDK and page-as-Markdown API, live source schemas, all iteration-page Markdown responses, unsupported blocks, media, and rate-limit behavior are checked against the selected boundary. |
| Luo delivery and coverage                | Complete      | Candidate and completed fixture builds have pinned sources, license, metadata, checksums, measured payloads, corpus-derived coverage, fallback behavior, and real-browser loading evidence; every later build derives its own corpus inventory.    |
| Visual direction                         | Complete      | Light and dark token roles, typography, responsive translation, focus, contrast, generated matching fallback, and representative content surfaces were inspected in real rendered pixels; no visual preference remains open.                       |
| Technology rationale                     | Complete      | Each selected technology has evidence-backed benefits, costs, rejected plausible alternatives, and a concrete reconsideration condition without inventing Yunfei's personal motivation.                                                            |
| Product and architecture decision packet | Complete      | Notion onboarding and editing, canonical routes and navigation, and every earlier product and architecture preference have been selected and distilled into their owning records.                                                                  |

## Evidence collected

All observations in this section use repository revision `e023e79cc398bb4312cd3eec49dd2a39043fad65` unless stated otherwise. Source and committed snapshots at that baseline are prototype evidence only. Disposable projects and browser artifacts were created under `/tmp`; their durable value is the reproducible command, exact version, and finding recorded here rather than the temporary file itself.

### Initial prototype and migration surface

`pnpm check:build` completed with the committed snapshots and generated 30 HTML pages plus 30 page payloads, `200.html`, and `404.html`. The page set was `/`, `/about`, 16 published post routes, `/blog/page/2`, `/tags`, nine first-page tag routes, and `/tags/Frontend/page/2`. The crawler discovered this set from links beginning at `/`; the complete dynamic route set is not registered independently.

The committed snapshot corpus has 24 database rows: 16 published posts, seven drafts, and one published `Content` page. The prototype requires `Title`, `Slug`, `Date`, `Status`, `Type`, and `Tags`; `Description` may be empty. Published posts sort newest first, content pages sort by title, duplicate slugs silently replace earlier rows in the lookup maps, and the page size is ten.

The visible route families are a post index and pagination, post details, a tag index and tag pagination, top-level content pages, and a standalone error page. Normal pages share the Navbar, main shell, and Footer. The Navbar currently derives top-level content links from content rows, uses ordinary anchors for full-document navigation, exposes optional GitHub and X links, has a mobile menu, and cycles system, light, and dark preferences. None of these behaviors becomes a future requirement without Yunfei selecting it.

The migration accounted for nine `usePrerenderData` responsibilities: shared navigation, shared footer, home data, later post-index pages, individual post data, individual content-page data, tag-index data, tag-page data, and page-specific prerendered Notion HTML. In the baseline, Post and Content payloads contained a complete Notion `recordMap`; `NotionPage.vue` also serialized server-rendered React HTML under a second key and inserted that HTML into the generated document before hydrating a React subtree in Vue.

The generated public artifact measured about 2.1 MiB. Its 30 extracted Nuxt payloads totaled 820,531 bytes before transport compression, with individual post payloads between 29,471 and 76,450 bytes. The article-only JavaScript chunk containing the React, `react-notion-x`, Prism, and tweet hydration path was 400,981 bytes raw and 131,124 bytes with gzip; the shared Nuxt application chunk was 184,242 bytes raw and 68,968 bytes with gzip. These numbers describe the prototype fixture and are not a target budget, but they make the cross-framework renderer and repeated content representation a concrete migration cost.

The current renderer surface present in published snapshots includes paragraphs, three heading levels, bulleted and numbered lists, code, dividers, tasks, quotes, callouts, a table of contents, and tweets. There are no published images or signed file URLs in the fixture, so the current build cannot prove an image or expiring-media path. Collection rendering is explicitly suppressed.

Two real-browser failures were reproduced against a fresh generated artifact. Directly opening the generated `200.html` or `404.html` starts a client-only shell without the shared prerender payload; `navbar-data` then reaches the production prerender guard and the visible result becomes a 500 page. On `/blog/javascript-bundlers-evolution`, the prerendered tweet skeleton fetched `react-tweet.vercel.app` successfully, React then raised `TypeError: o is not iterable`, and the entire Notion body disappeared rather than isolating the failed embed. These are defects and replacement evidence, not future behavior to preserve.

Other prototype semantics are now migration evidence rather than open product decisions: drafts are omitted from indexes but are still returned by slug lookup if their route is otherwise reached; missing post and content slugs become generic 500 errors rather than 404 responses; an unknown tag's first page is a valid empty result; tag matching is case-sensitive; date presentation is English and does not pin a timezone; and host-specific fallback behavior determines whether an unknown static URL ever reaches Nuxt's `200.html` or `404.html`. The accepted future rules above replace these behaviors where they conflict.

Local site configuration has only title, description, author, GitHub, and X. Setting `NOTION_CONFIG_PAGE_ID` replaces the local object with a remote Notion Name/Value database rather than merging it. Dot-separated names form nested objects, but every value remains a string despite a source comment claiming JSON parsing, and no runtime schema validates the result. `NOTION_DATABASE_PAGE_ID`, `NOTION_CONFIG_PAGE_ID`, `USE_SNAPSHOT`, `UPDATE_SNAPSHOT`, and the internal `NUXT_PREPARE` switch are the effective environment boundary; `NOTION_CONFIG_ID` is declared but unused.

### Live iteration sources and public-route audit

On 2026-07-12, Yunfei supplied a temporary user-owned Notion credential and separate Content and Config database URLs for read-only iteration. The credential and all source locator values are intentionally absent from every record and committed file. Each database resolved to its intended data source, and database retrieval, data-source retrieval, queries, and page-as-Markdown all returned HTTP 200.

The content source has 24 rows: 17 Published and seven Draft; 23 use Type `Post` and one uses `Content`. Its properties are `Title`, `Slug`, `Date`, `Status`, `Type`, `Description`, and `Tags`. The configuration source has nine enabled `Description`/`Key`/`Value`/`Enable` rows for `Author`, `Description`, `GitHub`, `Lang`, `Link`, `PostsPerPage`, `Since`, `Title`, and `X(Twitter)`. Their values match the selected types: strings, absolute HTTP(S) URLs, a BCP 47 tag, a positive page-size integer, and an integer calendar year. The target template additionally includes `Timezone`, `ShowInNavigation`, and `NavigationOrder`; the supplied iteration fixture may omit them because their adapter defaults are defined.

Every page body was retrieved through the official Markdown endpoint. Three responses were marked truncated with one unknown block each; block inspection identified all three as X embeds, two Published and one Draft. After fenced and inline code were excluded from syntax inspection, the only Notion XML-like extensions in the corpus were `callout`, `table_of_contents`, and `unknown`. This supports a bounded normalizer and the selected X link-card degradation without adding another UI runtime.

The supplied configuration identifies these sources as the `musubi.hyf.me` demo, so their slugs are iteration fixtures rather than Yunfei-site compatibility requirements. A separate public audit of [`hyf.me`](https://hyf.me/) found five working article links, all under `/blog/:slug`: [`agent-skills-practice-vue-tsc-missing-components-en`](https://hyf.me/blog/agent-skills-practice-vue-tsc-missing-components-en), [`agent-skills-practice-vue-tsc-missing-components`](https://hyf.me/blog/agent-skills-practice-vue-tsc-missing-components), [`claude-code-in-rolldown-en`](https://hyf.me/blog/claude-code-in-rolldown-en), [`claude-code-in-rolldown`](https://hyf.me/blog/claude-code-in-rolldown), and [`graduation`](https://hyf.me/blog/graduation). The site's Tags navigation destination returned 404 during the same audit and is not a working route to preserve.

### Vite+ reference convention

A disposable `vp create nuxt` experiment ran at `2026-07-11T18:55:48Z` with global and local Vite+ `0.2.4`, managed Node `24.18.0` resolved from the moving `lts` selector, pnpm `10.24.0`, create-nuxt `3.36.1`, Nuxt `4.4.8`, Vue `3.5.39`, and Nitro `2.13.4`. The target directory had to be forwarded after `--`; outer Vite+ non-interactive and package-manager flags did not answer create-nuxt's own prompts. Both help surfaces were inspected and the external template received its deterministic template, package-manager, Git, module-selection, and target-directory options explicitly.

The fresh template generated Nuxt lifecycle package scripts, `prepare: vp config`, a root Vite+ `vite.config.ts` with formatting, type-aware linting, staged checks, and a `vp staged` pre-commit hook, plus a pnpm workspace catalog. It did not generate a Node pin, CI workflow, Nuxt typecheck script, `ready` script, or Musubi-appropriate agent instructions. Its generic agent block recommends tests and therefore must be adapted rather than copied.

The fresh template replaced every effective `vite` resolution with `@voidzero-dev/vite-plus-core@0.2.4`. Removing the root `vite` dependency, its catalog entry, its pnpm override, and only the peer-rule exceptions introduced for that replacement, while retaining `vite-plus`, made Nuxt and its peers resolve upstream Vite `7.3.6`; `vp run build` still passed. Direct `vp build` invoked Vite+'s bundled Vite `8.1.3` and failed because a Nuxt application has no Vite `index.html` entry. This proves both the requested upstream-Vite exception and the rule that Nuxt lifecycle commands remain package scripts invoked by `vp run`.

Vite+ itself transitively installs Vitest browser packages. Musubi's no-test direction can prohibit a Musubi test suite, test scripts, and separately selected test dependencies; it cannot truthfully promise that no test-named transitive package exists while the full `vite-plus` package is installed.

With root `run.cache: false`, repeated ordinary package-script and Vite-task runs executed twice. A caller-supplied `vp run --cache` nevertheless overrode the root setting for a package script and replayed the second run as a cache hit. A Vite task with its own `cache: false` stayed uncached even under `--cache`. The durable rule therefore needs all three parts: root `run.cache: false`, `cache: false` on every declared Vite task, and a prohibition on `--cache`; package scripts remain protected by the root setting plus that command convention.

### Native Nuxt API-route prerender behavior

The disposable Nuxt project used upstream Vite and two pages that called `useFetch('/api/build-only')` while prerendering. Both generated documents and `_payload.json` files contained the returned data, and browser hydration, client navigation, and hard refresh used those payloads without requesting `/api/build-only`. No `.output/public/api/build-only` artifact existed. A server API used only as a page's build-time input therefore does not become a public static endpoint merely because a prerendered page called it.

The home page separately called `prerenderRoutes('/api/public-static')`. Generation emitted `.output/public/api/public-static`, and an isolated server exposing only `.output/public` returned its JSON bytes with HTTP 200. The simple static server labeled it `application/octet-stream`, so `$fetch` needed an explicit JSON response type. Browser network evidence contained exactly one API request: the user-triggered request to that public route. Dynamic public API routes must therefore be registered deliberately and verified against the selected static host; link crawling does not discover them.

This closes the factual part of the `nuxt-prerender-kit` replacement. The selected static architecture keeps replacement data routes build-only and emits no public API by default. A future browser-addressable static API would require its own concrete product need.

### Notion acquisition and Markdown

Stable [`notion-to-md@3.1.9`](https://github.com/souvikinator/notion-to-md/releases/tag/v3.1.9) is Markdown-first. Its [`MdBlock`](https://github.com/souvikinator/notion-to-md/blob/693f7165f2d6be46c02695c3e4cb48e0c017e584/src/types/index.ts#L71-L78) stores already-rendered Markdown in `parent`, and custom transformers also return strings. That output could feed a Markdown parser, but the converter is compiled against old block API types, silently skips `unsupported`, and leaves Musubi owning the missing-content and media checks around it.

The published `4.0.0-alpha.7` adds a recursive [`blockTree`](https://github.com/souvikinator/notion-to-md/blob/081607a12f6a7add37d8eba296b84bcd993e85c5/src/types/module.ts#L7-L20) and an exported [`BlockFetcher`](https://github.com/souvikinator/notion-to-md/blob/081607a12f6a7add37d8eba296b84bcd993e85c5/src/core/block-fetcher/index.ts#L79-L128), but that tree is an old Notion SDK response mutated with children, comments, buffers, and rewritten URLs rather than a stable application-owned model. Its peer range remains [`@notionhq/client ^2.0.0`](https://github.com/souvikinator/notion-to-md/blob/081607a12f6a7add37d8eba296b84bcd993e85c5/package.json#L22-L24), its fetcher filters [`unsupported` blocks](https://github.com/souvikinator/notion-to-md/blob/081607a12f6a7add37d8eba296b84bcd993e85c5/src/utils/notion/index.ts#L342-L369), and its media and rate-limit behavior cannot satisfy Musubi's required diagnostics and generation-failure rules without owning those responsibilities anyway.

The current official SDK release at inspection was [`@notionhq/client@5.23.0`](https://github.com/makenotion/notion-sdk-js/releases/tag/v5.23.0), with explicit API-version selection and a typed `pages.retrieveMarkdown` endpoint. The official response contains a Markdown string, a `truncated` flag, and `unknown_block_ids`. Its documented Notion-flavored Markdown covers the accepted paragraphs, headings, lists, tasks, quotes, callouts, code, tables, dividers, media, table of contents, and nested structures through standard syntax plus named XML-like extensions.

The official Markdown endpoint still has limits: bookmarks, embeds, link previews, permissions gaps, and very large pages can appear as `<unknown>` nodes. Musubi must reject truncation or unknown required content, and may use the block API to diagnose or recover a separately supported optional embed. The parser must understand only the accepted Notion-flavored Markdown dialect instead of treating its XML-like extensions as arbitrary trusted HTML.

A disposable `remark-parse` plus `remark-gfm` plus `remark-mdx` parse of the official representative syntax produced inspectable syntax-tree nodes for callouts, nested Markdown, tables, table of contents, tasks, and unknown tags. Heading attribute lists require a Musubi normalization rule. MDX is therefore useful only as parsing syntax: the normalizer must allowlist Notion tags and attributes, reject expressions and unknown HTML, and never compile or execute content.

Notion file URLs [expire after about one hour](https://developers.notion.com/guides/data-apis/retrieving-files), so the SSG build owns downloading, deduplicating, naming, and rewriting required assets. The official service documents an average limit of three requests per second and [`Retry-After` behavior](https://developers.notion.com/reference/request-limits).

This comparison supports the selected Markdown-first path without making `notion-to-md` a core dependency: official data-source queries provide typed metadata and settings, official page-as-Markdown provides the body, a bounded Musubi parser produces an internal syntax tree, and Vue renders that tree. A custom JSON model remains a reconsideration path if Markdown becomes lossy or costly.

### Luo delivery and real-content coverage

The live specimen at `https://luo.tw93.fun/` served a 318,444-byte `Luo-Regular.woff2` whose SHA-256 is `661581c1210598a1b6950c34b160fe0318b4cdc122fea8aeed11691555336724`, exactly matching source commit `588c4f3dbe3a0e9b3b860ca62f61ca9b373909d1` and font metadata `Version 0.3.0`. The repository's current `main` at `cf548a9ed1ae4034c43d647e8b32090d84630cb2` contains a 327,340-byte `Version 0.4.11` WOFF2 with SHA-256 `4b17fa4f2f344208ee4ae3a3aec787f7dcaf94c1b3f2f1605ed8ba822a90f130`. The repository README says a `v0.3.0-final` tag exists, but the remote currently exposes no tags, so a commit ID is the only verified stable source identifier.

The live build contains 1,116 unified CJK characters; current `main` contains 1,119. Current `main` is not a superset of the live build: it adds ten CJK characters and removes seven. Loading a mutable `main` URL can therefore change not only glyph drawings but whether a character uses Luo at all.

A representative historical corpus combined Yunfei's 20 public `_posts/*.md` files at `hyf0/iheyunfei.github.io@bbe2c874b8d53c6db59c2a46b7abd17de83daa9a` with the Chinese PCR explanation at `hyf0/project-context-records@7dbec8b4524f0fa3ed9ef15aab58e6a5e2d1d5cf`. Across 54,355 CJK character occurrences and 1,476 unique CJK characters, current Luo covered 774 unique characters and missed 702, or 52.44% unique coverage; occurrence-weighted coverage was 90.43%. This corpus is evidence of realistic technical and personal prose, not a promise about future articles. The completed fixture build reran the inventory against every Published body, public setting, navigation label, rendered date, and application-owned string; because the fixture is English, its Chinese-typography set contained only U+00B7 and U+2014, and both were supplied by the generated fallback.

In a real browser, the missing characters visibly switched from Luo's print-kai texture to the platform sans fallback within ordinary sentences. The live Luo CSS also expands a Latin stack that already ends in generic `sans-serif` before listing `Noto Sans CJK SC`, making that named fallback unreachable in its own computed family order. Musubi's explicit stack does not repeat that mistake, but naming a font that is neither bundled nor guaranteed by the operating system still produces platform-dependent results.

Luo is built from pinned `LXGW WenKai Screen v1.522`, whose source TTF is 24.5 MiB and whose complete WOFF2 was 9.6 MiB in the disposable conversion. FontTools `4.63.0` subsetting that base to the 702 Luo-missing characters in the pinned representative corpus produced a 199 KiB WOFF2 with SHA-256 `9964c079a99399568477fc2cf4c324ccc537e551139a1272e636e2a3747ba6e3`, compared with the 320 KiB current Luo file. A content-derived matching fallback can therefore make the mixed texture more coherent without shipping the complete base font, but it adds a deterministic font-subsetting build responsibility and must be regenerated when content changes. A system fallback has no additional transfer cost but varies across devices; a complete self-hosted fallback is stable but disproportionately large.

A second disposable spike verified that this build responsibility does not require a separately installed Python or native font tool. `subset-font@2.5.0`, using HarfBuzz WebAssembly, converted nine selected characters from the 25,673,994-byte LXGW source TTF into a 3,656-byte WOFF2. `fonteditor-core@2.6.3`, using its WebAssembly WOFF2 support, then changed the reserved family, full, unique, and PostScript identities to `Musubi CJK Fallback` and emitted a 3,716-byte WOFF2. `ttx` inspection verified the changed name records and retained copyright metadata. The completed implementation pins those versions, validates deterministic output and every font identity and code point, records the actual corpus and checksums, and verifies both faces in the browser.

Both Luo and its pinned LXGW base use SIL Open Font License 1.1. The license declares `LXGW WenKai` a Reserved Font Name. A subset or format conversion is a Modified Version, so any generated fallback must use a non-reserved primary and internal font name such as `Musubi CJK Fallback`; changing only the CSS family alias is not sufficient. Copyright and OFL metadata must remain in the font, and the copyright notice plus license must ship with it. Whichever files ship must also be pinned, self-hosted, and checksummed. Luo remains weight 400 and normal style only; synthetic weight and style must remain disabled.

### Visual-reference and dark-token checks

The browser observations in this section used `agent-browser 0.31.1` driving Chrome `150.0.7871.101`.

At `1440x900`, Kami's white print page rendered a centered 794-pixel paper body with warm black type, warm neutral rules, one blue accent, restrained labels, a four-value metrics row, and two-column editorial sections. It loaded two TsangerJinKai02 font weights and had no page or console error. At `390x844`, the same reference produced a 584-pixel document and retained two columns; the fourth metric and part of the content were clipped horizontally. This directly supports translating its hierarchy and palette while rejecting its fixed print geometry for the responsive site.

Every selected light and dark text token met WCAG AA against its canvas at the time of this research. The lowest light text contrast was `light-meta` at 5.43:1; the lowest dark text contrast was `dark-meta` at 5.88:1. The then-selected `#9FBDE2` dark accent measured 9.53:1 against the canvas, 8.54:1 against the ordinary dark surface, and 6.83:1 against the stronger dark surface. These measurements are historical evidence; the current generated accent and its verification live in the dark-brand derivation record. The thin border tokens are deliberately low-contrast decorative separators and must not become the sole boundary or focus indication for an interactive control.

A disposable representative article rendered the exact light and dark tokens, Luo plus a matching content subset, long mixed-script prose, metadata, a prose link, heading, quote, code block, and theme control. The normal desktop light and dark first viewports were calm, readable, and consistent with the selected Kami characteristics. The first narrow rendering exposed a missing article gutter and a single-character final line in the title; applying the recorded 20-pixel gutter and balancing the two-line display title removed both visible defects without horizontal overflow. The two-pixel accent focus outline with a three-pixel offset remained clearly visible in dark mode.

Yunfei selected this warm dark palette alongside the light theme. The design record also requires multi-line display titles to avoid a single CJK character on the final line, while leaving the exact wrapping mechanism to implementation and browser support.

## Evidence boundaries and final review

- At the research baseline, `README.md`, `ROADMAP.md`, `website.config.ts`, and the application described the Notion-backed prototype. The migration removed the obsolete prototype files and behavior; the rewritten README now describes the selected static product, while the measurements above remain historical evidence.
- `goal.md` records the selected project outcome, success condition, required surface, audience, defining qualities, non-goals, and deferred automatic deployment trigger.
- `architecture.md` records one coherent selected system rather than preserving the superseded option matrix. It has no open architecture choice.
- `DESIGN.md` contains the selected light and dark tokens, typography values, and generated matching Luo fallback.
- `technology-stack.md` has a concise vouched `Selected technologies` section covering selected tools, essential integration restrictions, brief reasons, and reconsideration conditions. Its responsibility-boundary note remains unstamped, and architecture, migration, verification, and research details remain in their owning records.
- `migration-plan.md` records the completed replacement responsibilities, exact local artifact, real-browser acceptance, and remaining external scope. The user-facing Notion schemas, environment boundary, canonical routes, and navigation behavior remain selected target architecture rather than implementation accidents.

## Current use

Research established feasibility, costs, consequences, and technical recommendations, and Yunfei selected every product and architecture preference in this packet. The completed repository-local implementation follows those records without another vouch or authorization gate. Historical observations remain evidence; they do not override the current records or turn deferred external and release work into repository-local tasks.

## Completion audit

The unattended research run satisfies its completion conditions:

- Every workstream above is closed with stable-source or reproducible evidence, and every product or architecture preference raised by the packet has been selected.
- No open product or architecture question remains to be narrowed by another repository inspection, primary-source lookup, disposable experiment, generated-artifact inspection, representative-content analysis, or real-browser review.
- The final packet records the selected direction, verified consequences, rejected alternatives, reconsideration conditions, and the records affected by each choice.
- The packet identifies the selected direction, its evidence, its owning records, and the separate implementation `/goal` prompt.
- At the `e023e79` research baseline, no Musubi implementation, migration, deployment, or push had occurred. Later repository history owns the implementation state; this research record does not claim that historical condition remains current.