# Musubi Design Decisions

## Purpose

This file records Yunfei's explicit visual requirements, preferences, and rejections for Musubi. Future design work must read it before proposing or implementing a visual direction.

This is not an AI-generated design specification. [DESIGN.md](./DESIGN.md) may translate accepted decisions into concrete colors, typography, spacing, layout, and component rules, but the current implementation and `DESIGN.md` do not prove that Yunfei prefers those choices.

Record a preference only after Yunfei has stated or selected it. A coherent proposal, a completed implementation, a passing browser review, resemblance to a reference, or the absence of an objection does not imply acceptance.

## Current state

- **2026-07-14 — Current overall style:** Yunfei does not like the current overall visual design.
- This is an overall reaction, not a separate rejection of every current color, typeface, layout choice, or component.
- **2026-07-16 — Accepted replacement direction:** After the recorded decisions were implemented and reviewed across Home, Blog, Post, Page, 404, desktop and narrow layouts, light and dark themes, typography, article components, navigation, and interaction states, Yunfei directed the project to complete the whole-site confirmation and close the open overall direction.
- Accepted replacement requirements now cover the light- and dark-theme page backgrounds, standard neutral container surfaces, and four-level warm-neutral text hierarchies for the page and standard dark container; a single general-purpose brand accent family with a deterministic dark-theme derivation; web-adapted light- and dark-theme border hierarchies; Chinese and English typography, article-prose strong and language-aware `em` emphasis, the H1–H5 hierarchy, prose-link interaction, and the current-navigation state; the three-zone global header, route-to-route horizontal stability, sticky hide-and-reveal behavior, narrow-screen navigation overflow, default example identity, Home/Blog route roles, an English-only initial built-in interface, the shared content-led page opener, a five-Post Home recent view, Page composition and header boundary, missing-route and empty-Blog states, footer attribution semantics, and the accepted article heading-permalink, code-copy, exit-link, external-link, and resilient X-post-embed behaviors; the required Light, Dark, and System appearance modes with first-visit System, persisted reader choice, and a conventional three-choice icon control; the restrained reusable motion timing family and reduced-motion handling; the `1120px` outer page frame, single-axis homepage, article-page, and Page structure, shared `720px` textual reading column, and three-tier non-prose content-width hierarchy with an initial all-`720px` delivery boundary; the long-form article reading and component systems, including Note-by-default Notion Callouts, the accepted recognized-only short-plus-complete declarations for Note, Warning, and Error, and their visible-label, icon-free, GitHub Primer semantic-line presentation; narrow-screen gutter and Kami-proportional vertical rhythm; the Kami inline-code treatment; the dual-theme GitHub fenced-code-block treatment; and the explicit exclusion of a maintained print presentation.
- This accepted direction is sufficient for the initial version. Deferred refinements such as inline-code contrast and explicit wide-media authoring do not reopen the overall direction.

## Decisions

### Overall visual direction

[VOUCHED @hyfdev 2026-07-16]

- **Date:** 2026-07-16.
- **Status:** Required.
- **Decision:** Accept the aligned v2 result, governed by the vouched decisions below, as Musubi's overall visual direction for the initial version.
- **Boundary:** Future component refinements and deferred authoring capabilities may improve this direction without reopening it. A materially different visual language, layout model, or typography system requires a new explicit decision.
- **Reason or reference:** Yunfei directed the project to finish the remaining implementation work, complete the whole-site confirmation, and close `Overall visual direction: Open`. The final review covered the public page types, responsive shell, light and dark themes, typography roles, navigation, article components, and interaction states.

### Page structure

[VOUCHED @hyfdev 2026-07-16]

- **Date:** Selected 2026-07-14; publication handling updated 2026-07-16.
- **Status:** Required.
- **Scope:** The global site header; the main-content composition of the homepage article index and long-form article pages, including homepage-entry hierarchy and article-title link behavior; and the alignment of the article-header divider. This decision does not set the footer's content or internal arrangement, a future identity mark, or whether Home and Blog are distinct routes. The separate outer-page-frame decision sets the shared shell width.
- **Global header:** Use a three-zone header on wide viewports. Place the configured site identity at the outer shell's left content edge, center a combined navigation module, and place only the appearance-mode control at the outer shell's right content edge. The centered module contains the primary site links followed by the social links, with a quiet neutral vertical divider separating site navigation from external destinations. Treat the combined module, rather than the primary links alone, as the centered object.
- **Narrow-screen header:** Preserve the same information hierarchy without squeezing every item into one row. Put the configured site name and appearance control on the first row at opposite edges, then center the combined primary-and-social navigation module on a second row.
- **Shared composition:** Use one vertical reading axis for the main content of both the homepage and article pages. Keep metadata in that flow rather than placing it in a separate right-hand rail.
- **Homepage column:** Center the homepage article index in one column capped at `720px`. Let it shrink on narrower viewports while retaining the approved `20px` minimum horizontal gutter.
- **Homepage entry order:** Start each entry with its title and date in the same inline flow, with the date immediately following the rendered title text instead of aligning to the column's right edge. Place an optional summary below that line. Show the date only and omit reading time. Do not reserve summary height or truncate a present summary: it may be absent, short, or a natural paragraph. Tags and categories are not part of the default homepage entry.
- **Homepage title treatment:** Use `20px` for homepage article-list titles. Chinese uses Tsanger JinKai 02 W04 and English uses regular Charter. This is an explicit exception to the general W05 treatment for Chinese titles because an article-list entry is a restrained navigation item, not the H1 of the opened article page.
- **Homepage title interaction:** Render every homepage article title as a link. Hover and keyboard focus use the current theme's shared brand-accent role, and the pressed or active state must provide a visible response. Preserve the separately approved keyboard focus indicator rather than relying on color alone.
- **Article-page composition:** Align the H1, optional lede, metadata, and prose to the same `720px` content column, sharing both left and right boundaries. Keep metadata on the main axis rather than moving it into a side rail. Treat the long divider below the article header as outer-shell structure rather than article content: align its left endpoint with the site identity's left content edge and its right endpoint with the appearance control's right content edge. Do not constrain the divider to the `720px` column or extend it through the shell's horizontal padding.
- **Article boundary spacing:** Keep the transition from metadata to the outer-frame divider and from that divider to the article body compact. The divider marks a boundary; it must not create a large decorative blank band between the publication date and the first paragraph. The current `24px` spacing on each side is an implementation response to this requirement and remains part of the live whole-site review rather than a separately selected universal spacing token.
- **Reason or reference:** Yunfei prefers a restrained single-axis layout that reads like one sheet of paper. He selected this structure after comparing wider and split article headers, a wider homepage index, right-aligned versus inline dates, absent versus short versus paragraph-length summaries, several placements for the site identity, primary navigation, social links, and appearance control, and the final desktop and narrow-screen specimens. He then accepted aligning the article-header divider with the outer header controls so both express the same page frame while the title and prose retain their reading axis.

### Route-to-route horizontal stability

[VOUCHED @hyfdev 2026-07-16]

- **Date:** 2026-07-16.
- **Status:** Required.
- **Scope:** The horizontal position of the global header, outer frame, and `720px` reading axis when moving among short and long routes whose need for a vertical scrollbar differs.
- **Decision:** Keep the site identity, centered navigation, appearance control, outer-frame boundaries, and reading column at the same physical horizontal coordinates across routes. Reserve scrollbar space symmetrically or use an equivalent browser-safe mechanism so scrollbar appearance cannot make the page jump. The document still must not gain horizontal scrolling.
- **Reason or reference:** Yunfei noticed the header controls and content axis shifting when moving between Home and Page and identified the route-dependent scrollbar as the likely cause. Header structure is global and must remain stable while content length changes.

### Narrow-screen navigation overflow

[VOUCHED @hyfdev 2026-07-16]

- **Date:** 2026-07-16.
- **Status:** Required.
- **Scope:** The accepted second-row navigation module when a narrow viewport cannot display all configured site and social links at once.
- **Behavior while content fits:** Keep the combined navigation module centered on one line.
- **Overflow behavior:** When the links exceed the available width, keep the module on one line and let only that navigation row scroll horizontally. Support touch, trackpad, and keyboard access without introducing document-level horizontal overflow. Do not wrap the links into another row and do not replace the visible navigation with a menu by default.
- **Position and cue:** Bring the current-page item into view when necessary. Use quiet edge fades to indicate additional off-screen links, updating the cues as the reader scrolls.
- **Reason or reference:** Yunfei accepted the local-scroll treatment after reviewing it with an intentionally overfilled narrow-screen header. It preserves the approved `88px` two-row header and keeps the primary routes visible, while wrapping would change the header height and a menu would hide destinations that normally remain exposed.

### Default example identity, route roles, and sticky header behavior

[VOUCHED @hyfdev 2026-07-22]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The identity shown by Musubi's default example, the distinct roles of the default Home and Blog routes, the absence of a default About route, and the global header's scroll behavior. This decision does not set the final footer copy or the exact shared header and footer height.
- **Default example identity:** Display `Musubi` as the site name in the framework's default example. Treat it as the example's configured site identity, not as a hard-coded requirement for deployed personal sites. A deployer replaces that configuration with the deployed site's own name.
- **Header identity treatment:** Render the configured site name as plain text. Do not add an icon, decorative rule, or AI-invented mark. A future logo or icon requires a separate explicit decision.
- **Home:** Use Home as a restrained recent-articles view that may open with authored prose. One optional `Type = Home` row supplies that opening; when no such row is published, Home begins with the list. Do not add a hero or an equivalent promotional block, and do not let the opening grow until the list falls below the fold.
- **Blog:** Use `/blog` as the complete chronological archive and display every published article on that one page. Do not introduce article-index pagination, pagination controls, or `/blog/page/:page` routes. Home remains the restrained recent-articles view, while Blog provides the complete collection; this distinct role is why both remain in the primary navigation.
- **About:** Do not provide an About page or navigation item by default.
- **Sticky header:** Keep the global header sticky while preserving the page's reading space. When the reader scrolls downward, slide the header upward out of view; when the reader scrolls upward, reveal it again. Keep it visible at the top of the page.
- **Reason or reference:** Yunfei wants the framework example to identify itself as Musubi while allowing a deployed site to supply its own name. He accepted the recent-versus-archive separation, rejected a default About page, and explicitly selected the hide-on-downward-scroll and reveal-on-upward-scroll header behavior. He originally rejected a homepage introduction as well, and reversed that on 2026-07-22 after writing one and comparing the result against peer personal sites; the introduction is authored content the owner opts into, not a promotional block the framework ships.

### Initial built-in interface language

[VOUCHED @hyfdev 2026-07-16]

- **Date:** 2026-07-16.
- **Status:** Required for the initial version.
- **Scope:** Reader-facing words and messages authored by Musubi itself, including global-route labels, appearance-mode names and accessible descriptions, code-copy feedback, Post exit text, missing-route and empty-state messages, and other finite framework-owned interface copy. This does not govern author-authored Notion content or configured site identity and navigation titles.
- **Decision:** Provide the initial built-in interface in English only. Do not ship a Chinese interface dictionary, language picker, browser-language negotiation, per-page automatic interface switching, or a general localization framework in the initial version.
- **Content boundary:** Preserve Notion-authored titles, summaries, article and Page content, captions, configured names, and other owner-supplied copy in the language the owner writes. English-only built-in interface copy does not restrict which languages the site may publish and does not translate author content.
- **Existing `Lang` boundary:** Keep the existing BCP 47 `Lang` setting for document language metadata and locale-sensitive formatting such as publication dates. In the initial version it does not select a translated Musubi interface, and accepting a valid non-English tag must not be described as built-in interface-language support. When the document `Lang` is not English, mark Musubi-owned English interface strings or an appropriate shared container with `lang="en"` so assistive technology does not pronounce them as the document language; do not override the language of owner-authored content.
- **Consistency:** Keep the separately accepted `Note`, `Warning`, and `Error` labels in English. All other framework-owned reader-facing states must use one consistent English vocabulary; exact sentences remain an implementation and editorial pass as long as they preserve the accepted behaviors.
- **Future boundary:** Treat additional interface languages as later product work requiring a complete, reviewed vocabulary rather than scattered component overrides. This decision does not reject future localization.
- **Reason or reference:** Yunfei selected an English-only first version to keep the initial product and maintenance surface small while leaving Notion-authored content free to be multilingual.

### Shared content-led page opener

[VOUCHED @hyfdev 2026-07-22]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The visible beginning of the default Home, Blog, Post, and Page surfaces. This decision governs whether a route adds a visible page heading and whether a label or decorative short rule precedes that heading. It does not alter the separately accepted long outer-shell divider below Post and Page headers.
- **Home:** Begin with the optional authored opening when one is published, otherwise with the recent-article list. Do not add a visible Home-page H1: the opening carries no title of its own, and the `Type = Home` row's Title is never rendered. The list below the opening does take a small interface-tier label naming it, because with prose above it the list otherwise has neither a name nor a boundary; that label is the only naming block Home may add.
- **Blog, Post, and Page:** Begin directly with the route's semantic H1. Continue with the optional lede, metadata, and body elements already selected for that surface; do not place an eyebrow label or decorative short brand-colored rule above the H1.
- **Rejected recurring opener:** Do not use labels such as `Writing`, `Archive`, `Article`, or `Page` as a recurring visual signature above page titles. Kami's print-oriented label-and-short-rule treatment is a reference, not a requirement to reproduce on the web.
- **Divider boundary:** Home and Blog do not gain a long divider as a substitute for the omitted opener decoration. Post and Page retain the long outer-shell header divider under their separately accepted composition rules.
- **Reason or reference:** Yunfei selected the no-Home-heading option after comparing three coherent opener systems across Home, Blog, Post, and Page. This keeps Home content-led, avoids repeating route meaning above already sufficient H1s, and preserves the restrained single-axis composition without adding a print-derived signature to every web surface. On 2026-07-22 he admitted the list label once Home gained an opening above the list: he declined naming the page after itself, since `Home` names a navigation position rather than content, but accepted that the list itself needs a name once it is no longer the whole page.

### Home recent-Post count

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The number of published Posts shown by Musubi's default recent-articles Home. The complete Blog remains governed by its separate unpaginated archive decision.
- **Default count:** Show the five most recently published Posts, ordered from newest to oldest. If fewer than five Posts exist, show every available Post without placeholders or empty rows.
- **Configuration boundary:** Five is the selected product default. This decision does not yet require or reject a deployer-facing setting that changes the count.
- **Reason or reference:** Yunfei selected five after comparing three-, five-, and eight-Post Home specimens. Five provides recent context while keeping Home materially shorter than the complete Blog archive.

### Home opening prose

[VOUCHED @hyfdev 2026-07-22]

- **Ruling:** A single optional Notion row with `Type = Home` contributes authored prose above Home's recent-Post list; that row never renders its own Title and never claims a Slug, and the index below it is compressed rather than repeated from Blog.
- **Composition:** The opening starts at the page padding, on the line where every other route puts its first ink, and Home reserves no room for the title it does not render. The index carries a small interface-tier label, entries keep the `20px` title but drop their separators, and each summary falls to the metadata tier so title, summary, and date read as three steps. A single ellipsis, at body size and underlined, leads to `/blog`; its accessible name carries the meaning the mark cannot.
- **Limits:** The recent-Post count stays five. Nothing bounds how long the opening may be, and an opening that pushes the list out of view defeats it. Home is a third routing kind beside Post and Page, not a Page pinned to `/`: it takes no Publish Date and never enters navigation. Whether the row's Description should feed the metadata for `/`, which still comes from Config, is open.
- **Why:** Yunfei wanted an introduction on his own Home without giving up the recent-Post list, and picked prose above the list over replacing Home with a standalone Page. Offered `Type = Home` against three Slug-based alternatives, he chose it directly. He declined putting his name or the site name in the title slot as too showy, which is why the page carries no H1 at all. He kept the summaries but asked that they separate from the titles, and chose the ellipsis over the words `More posts`, keeping its underline on the grounds that an underline is what makes a thing look clickable.
- **Source:** Yunfei, 2026-07-21 to 2026-07-22, working from a running preview. The Slug alternatives rejected on his behalf, with reasoning supplied by the implementer rather than by him: a reserved `index` slug, a magic value that would also make `/index` vanish; an empty Slug meaning root, which would turn a loud validation error into a silent home-page takeover; and an `Is Home` checkbox on a Page, leaving the same content reachable at both `/` and `/:slug`. A Slug cannot express `/` in any case — `invalidSlugDelimiter` rejects separators and a Page route is its slug with `/` prefixed.
- **Changed alongside:** This reverses the "Do not add a personal introduction" clause of **Default example identity, route roles, and sticky header behavior** and the "Begin directly with the recent-article list" clause of **Shared content-led page opener**, both vouched 2026-07-15; the list label it introduces also reverses that entry's rejection of a block naming the list. Both entries were rewritten and re-vouched on the same day. It also reverses the equivalent clause of the Layout Home bullet in [`DESIGN.md`](./DESIGN.md), which carried no stamp.

### Page composition

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Terminology and scope:** Use `Page` as the product name for a top-level, non-Post route; use “standalone Page” only when the surrounding sentence needs to distinguish it from other web pages. The canonical data model uses `Type = Page` at `/:slug`; legacy `Type = Content` remains a compatibility input during migration.
- **Composition:** Follow the same single-axis reading composition as a Post page. Cap the Page title and ordinary textual body at `720px`, align their left and right boundaries, center the column on wider viewports, and let it shrink on narrower viewports while retaining the approved `20px` minimum horizontal gutter.
- **Shared reading system:** Reuse the accepted article typography and prose-component rules rather than inventing a separate Page style. The separately accepted three-tier non-prose width hierarchy remains available when Page media genuinely needs `1120px` or viewport-width treatment; ordinary content stays on the `720px` axis.
- **Header content:** Start the Page with its H1 and an optional lede on the same `720px` axis. Do not display a Post publication date and do not render or reserve an empty metadata row merely to preserve the Post template. Future Page-specific header fields still require a separate decision.
- **Header boundary:** Retain the same long outer-shell divider used below the Post header. Align it with the outer frame's left and right content edges under the existing page-structure rule; do not constrain it to the `720px` column. The divider expresses the boundary between the Page introduction and its body rather than implying missing Post metadata. This decision selects the divider, not a new exact spacing value around it.
- **Reason or reference:** Yunfei wants Pages to retain the same one-sheet reading experience as Posts and explicitly selected the `720px` single-axis composition for both. He then selected the Post-like header-boundary variant after comparing it with an otherwise identical Page that omitted the divider; the two specimens kept the same body position so the divider was the only visual variable.

### Blog archive presentation

[VOUCHED @hyfdev 2026-07-16]

- **Date:** Selected 2026-07-15; date and separator treatment revised 2026-07-16.
- **Status:** Required.
- **Scope:** The visual organization and entry content of the complete, unpaginated `/blog` archive. The separate route-role decision governs its distinction from Home and the absence of pagination.
- **Year grouping:** Group all published articles by publication year, ordered from the newest year to the oldest, and keep articles within each year in reverse chronological order. Render each year as a quiet in-flow group heading on the `720px` single reading axis rather than as an oversized background numeral or a separate side rail.
- **Archive entries:** Start each entry with its title and date in the same inline flow, with the date immediately following the rendered title text. If an article has a description, display it naturally below that line; if it does not, reserve no empty summary space. Do not truncate a present description merely to keep the archive uniformly short: it may be one sentence or a natural paragraph.
- **Archive dates:** Because the surrounding group heading already supplies the year, show only the locale-formatted month and day beside each archive title. Keep the full publication date on Home and in the Post header, where no year heading supplies that context.
- **Separators:** Do not draw a border after every archive entry. Use one quiet secondary divider only between adjacent year groups; do not add a meaningless rule above the first year or after the final year.
- **Reason or reference:** Yunfei selected the year-grouped option after comparing it with one uninterrupted chronological list in the local Blog archive specimen, and explicitly required the archive to retain optional article descriptions instead of reducing every entry to title and date only. In the whole-site review, he found the repeated year and per-entry borders redundant and selected year-level grouping as the only repeated divider structure.

### Missing-route and empty-Blog states

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The public 404 page and the `/blog` archive when no Posts have been published. This does not define arbitrary application errors or loading states.
- **Shared treatment:** Keep both states plain and in the established page composition. Do not place them in feature cards and do not add decorative illustrations merely to occupy empty space.
- **404:** State clearly that the page does not exist and provide one ordinary text link back to Home so the reader has a useful next action.
- **Empty Blog:** Keep the normal Blog page identity and show a restrained statement that no Posts have been published. Do not add a call to action, because a public reader cannot publish the site's content.
- **Reason or reference:** Yunfei accepted the paired specimen and the distinction between an actionable missing route and a non-actionable empty archive. The interface supplies a way out only where the reader can actually use it.

### Article metadata content

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The metadata region in the header of a published article page. The existing article-page composition keeps this region on the shared `720px` reading axis below the optional lede; the separate small-text decision will set its final typography.
- **Current content:** Display only the publication date. Do not currently add the author, reading time, updated date, tags, categories, or other fields to the article header.
- **Future extension:** Treat the current date line as an extensible metadata region rather than a permanently date-only component. If future requirements approve more metadata, add it within this same region instead of creating a side rail or another competing header block. Do not render placeholders or reserve space for fields that are not present, and do not treat this extension point as prior approval of any particular future field.
- **Reason or reference:** Yunfei selected the date-only option in the local article-metadata comparison and wants to preserve a stable place where additional metadata can be added later if the product genuinely acquires more useful fields.

### Small-text typography hierarchy

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** Supporting prose, small interface text, passive metadata, captions, footer copy, and very short utility labels across the site. The article-body, heading, homepage-title, and code-block decisions continue to govern their own typography.
- **Supporting prose:** Use `16px` with a `26px` line height for text that is visually secondary but may still require sustained reading, including homepage and Blog descriptions and an article's optional lede. Do not reduce a paragraph-length description to metadata size merely because it is secondary to a title.
- **Small interface text:** Use `14px` with a `20px` line height for navigation, quiet Blog year headings, table-of-contents links, and comparable short interactive or structural text.
- **Metadata:** Use `13px` with a `20px` line height for publication dates, figure captions, footer copy, and comparable passive supporting facts.
- **Micro labels:** Use `12px` with a `16px` line height only for very short utility labels such as a fenced code block's language label. Treat `12px` as a floor, not as a general small-text size, and do not use this tier for prose or ordinary navigation.
- **System rule:** Reuse these four semantic roles rather than creating nearly identical component-specific sizes. Typography family, color, emphasis, and component placement remain governed by their separate accepted decisions.
- **Reason or reference:** Yunfei selected the balanced option after comparing the same article content, navigation, metadata, figure caption, code label, and footer in compact, balanced, and clearer scales, including an instant same-position switch and enlarged detail view. The selected hierarchy keeps paragraph-capable supporting copy readable while allowing metadata and bounded utility labels to remain quiet.

### Prose links and current navigation state

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** Ordinary links inside article prose and comparable reading text, plus the persistent current-page state in the global navigation. This does not govern article-list titles, standalone buttons, external-link rows, or the separately specified appearance-mode control.
- **Prose links:** Use the current theme's shared brand color for the link text and keep a thin underline visible at rest. Derive the resting underline from the same brand token at `42%` opacity, use a `1px` thickness and `3px` underline offset, and strengthen it to the full theme-appropriate brand color on hover. Keep the approved brand-colored keyboard focus outline so recognition never depends on color or hover alone.
- **Current navigation state:** Use the current theme's shared brand color for the active navigation label and place a `2px` brand-colored underline directly beneath that label, spanning only the label's width rather than the whole navigation cell. Other navigation links remain in the accepted neutral hierarchy and change to the brand color on hover. Preserve the keyboard focus indicator separately from the persistent current-page state.
- **Token coupling:** Both treatments must reference the shared theme-appropriate brand token. If the brand seed changes, the link text, resting and interactive underlines, current-page label, and current-page underline must change with it rather than retaining component-specific color values.
- **Reason or reference:** Yunfei selected option B in both local interaction comparisons. The prose-link treatment remains identifiable on touch screens before hover while becoming clearer during interaction; the navigation treatment gives the current page a stable structural marker without adding a filled container.

### Article heading-permalink, code-copy, exit, and external-link behavior

[VOUCHED @hyfdev 2026-07-15]

- **Date:** Selected 2026-07-15; heading-permalink positioning revised 2026-07-16.
- **Status:** Required.
- **Scope:** Section headings and fenced code blocks rendered in Post and Page content, the navigation shown after the final content of a Post, and ordinary external links in article prose and comparable reading content.
- **Heading permalink:** Give each article section heading a stable fragment destination and provide a `#` permalink beside it. On hover-capable desktop layouts, reveal the `#` when the heading is hovered or the permalink receives keyboard focus. On mobile and other layouts without reliable hover, keep it visible. Match the permalink's computed font size and line height to the heading level it belongs to rather than rendering it as small utility text, align it with the heading, and leave clearly visible whitespace between the symbol and title so they do not read as one token. Keep the title itself on the `720px` reading axis at every width; move the `#` into the outer gutter rather than shifting the title to reserve space. Use a `16px` gap on wide layouts and `8px` on narrow layouts. Retain a usable focus target. Color the `#` with the current theme's shared brand-accent token: the light-theme brand seed and its approved dark-theme derived value must update together whenever the brand seed changes rather than leaving a component-specific color behind. Activating it points the browser address at that exact section so the resulting URL can be shared.
- **Code copy:** Provide a visible Copy action on every fenced code block. Keep the action outside the horizontally scrolling code region so it remains available while long code scrolls locally. After activation, provide both visible and assistive success or failure feedback.
- **Post exit:** After the final content of a Post, provide one restrained `Back to Blog` link. Do not add previous-Post and next-Post navigation. Do not add this Blog-specific exit to a Page.
- **External links:** Open external destinations in a new browsing context, normally a new browser tab. Keep internal Musubi navigation in the current context. Apply the standard `noopener` protection when opening an untrusted external destination without transferring control of the originating page.
- **Reason or reference:** Yunfei selected these behaviors in the combined Home and article-utility specimen. He retained the contextual heading permalink after finding and testing it, then required its `#` to match the associated section heading's size instead of looking like a small annotation. Copy keeps code useful without changing its reading palette, one return link gives a directly opened Post a clear exit without imposing an artificial previous/next sequence, and external destinations should not replace the current Musubi page.

### Appearance-mode default and persistence

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The initial appearance mode on a first visit, persistence after an explicit reader choice, and the behavior of a persisted System choice. The separate appearance-mode-control decision governs the visible three-choice control.
- **First visit:** Default to System when no valid saved choice exists. Resolve the page to the operating system's current light-or-dark preference and respond if that preference changes.
- **Explicit choice:** When the reader deliberately selects Light, Dark, or System, persist that mode for later visits. A saved fixed Light or Dark choice overrides subsequent operating-system preference changes until the reader selects another mode.
- **Returning to System:** Selecting System again persists System as the reader's choice and immediately resumes following the operating system, including live changes while the page is open.
- **Invalid state:** Treat a missing, unreadable, or unsupported saved value as no saved choice and fall back to System.
- **Reason or reference:** Yunfei selected first-visit System plus persistence of later explicit choices. This respects the reader's operating-system preference before Musubi has a site-specific preference, while ensuring a deliberate site choice remains stable until changed.

### Appearance-mode control

[VOUCHED @hyfdev 2026-07-16]

- **Date:** Initial direction explored 2026-07-15; replacement selected 2026-07-16.
- **Status:** Required.
- **Scope:** The mode choices and visible form of the appearance control at the right edge of the accepted global header.
- **Required mode set:** Offer Light, Dark, and System. System is the automatic mode: it follows the operating system's current light-or-dark preference and responds when that preference changes. It is not a third color theme.
- **Selected control:** Use one restrained segmented group containing three adjacent icon buttons in the fixed order Light, Dark, System. A reader selects the desired mode directly; do not require cycling through the other states and do not hide the choices in a menu. Use a sun for fixed Light and a crescent moon for fixed Dark. Keep the active segment structurally visible, and give every segment an accurate accessible name and discoverable tooltip.
- **Resolved System state:** Use a monitor outline alone for System. Do not add a small sun, crescent, or other resolved-theme badge to the monitor: the separate Light and Dark segments already establish the three available choices, while the page itself visibly reflects the operating system's resolved palette. If the operating-system preference changes while System remains selected, update the page theme and the System segment's accessible name and tooltip without leaving System mode.
- **Rejected direction:** Remove the roller-blind decoration, its cover-and-reveal animation, and the earlier single-button cycle. Yunfei found the compact curtain specimen visually abrupt and selected the conventional direct three-choice treatment as the safer default.
- **Reason or reference:** The control should be immediately understandable and quiet enough to occupy the right edge of the header without becoming its visual subject. Direct choices make the persisted Light, Dark, or System state visible without requiring the reader to infer a cycle. Yunfei removed the resolved sun or crescent from the monitor because, once all three modes are shown side by side, that additional glyph repeats information and makes the System icon unnecessarily busy.

### Motion system

[VOUCHED @hyfdev 2026-07-16]

- **Date:** 2026-07-16.
- **Status:** Required.
- **Scope:** Reusable motion in the global shell and editorial interface, including color changes, link and permalink feedback, the sticky header, and appearance-control state feedback. This does not require every component to animate.
- **Decision:** Keep motion short and functional. Use approximately `120ms` for small opacity and link-state feedback, `160ms` for color and surface changes, and `180ms` for the header's hide-and-reveal transform. Appearance-mode selection changes directly and uses only the ordinary short color or surface transition.
- **Restraint:** Do not add page-entry animation, scroll-triggered content reveals, parallax, spring motion, decorative looping, or motion that delays reading. Motion should explain a state change or preserve spatial continuity.
- **Reduced motion:** Honor `prefers-reduced-motion: reduce` by making nonessential animation effectively immediate, disabling smooth scrolling, and applying appearance-mode changes without an animated intermediate state.
- **Reason or reference:** Yunfei asked to use the recommended restrained motion system. It passed the final whole-site review as part of the accepted overall direction; the short durations preserve the paper-like stillness while making link, header, and theme-state changes understandable.

### Footer attribution

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The default footer's ownership and framework-attribution text. This decision does not set the footer height or supersede the outer-frame alignment rule.
- **Ownership:** Place `© {currentYear} {siteOwner}` on the left. Treat `siteOwner` as a dedicated site setting rather than deriving it from the displayed site name; a personal deployment may therefore use a person's name even when the example or site title uses another name.
- **Framework attribution:** Place `Built with Musubi` on the right, with only `Musubi` linked to the project destination. Use `Built with`, not `Powered by`, because Musubi generates the static site at build time rather than continuously running it as a hosted service.
- **Narrow-screen layout:** Keep the ownership text and `Built with Musubi` on the same horizontal line on mobile. Do not stack the two footer items vertically.
- **Exclusion:** Do not include RSS in the default footer.
- **Reason or reference:** Yunfei selected the separated ownership and framework roles after reviewing common wording in official static-site-generator blog templates. The two sides state who owns the content and which framework built the site without conflating the person, site name, and tool.

### Shared header and footer height

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The visible height shared by the global header and footer at the desktop and narrow-screen layouts. The sticky header behavior remains governed by the separate decision above.
- **Decision:** Keep the header and footer equal and compact within each responsive layout. Use `60px` for both on desktop. Use `88px` for both on narrow screens, where the header needs two rows for the accepted navigation arrangement. Center their contents vertically without changing the footer to a two-row layout.
- **Reason or reference:** Yunfei wanted the two pieces of page chrome to feel symmetrical and found the earlier header too tall. He accepted the compact `60px` desktop and `88px` narrow-screen specimen after understanding that the larger mobile value accommodates the header's second row.

### Outer page frame width

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** The maximum visual width between the shared outer frame's left and right content edges. The global header content and the long divider below the article header use these edges; other components use them only when their own decision assigns them to the outer frame. This decision does not set the maximum width of the article title, media, figures, tables, or other non-prose content.
- **Decision:** Cap the shared outer page frame at `1120px`. Treat `1120px` as a maximum rather than a fixed width: on narrower viewports, shrink the frame fluidly and retain the already-approved minimum `20px` horizontal gutter between its content edges and the viewport. Do not widen the separately approved `720px` prose column with the frame.
- **Reason or reference:** Yunfei selected `1120px` after comparing `1040px`, `1120px`, and `1200px` with the same three-zone header and article specimen. `1120px` gave the header controls, full-width divider, and wider article structures more room than `1040px`, while `1200px` mainly moved the outer controls farther from the reading column. The comparison originally included a wider title specimen, but the later article-header decision deliberately returns all textual header content to `720px`; the outer frame remains `1120px` for its own structural roles and for the separately approved outer-frame content tier.

### Non-prose content width hierarchy

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Images, figures, diagrams, tables, callouts, code blocks, galleries, timelines, panoramas, and other non-prose content within long-form article pages. This decision governs horizontal extent and overflow behavior; it does not set the exact article-title maximum, component styling, caption placement, or vertical spacing. Homepage media remains outside this decision.
- **Decision:** Use three deliberate width tiers instead of choosing a new width for each component: the `720px` reading column, the `1120px` outer page frame, and the available viewport width. The `720px` tier is the default. Move content to a wider tier only when its information or browsing behavior requires it, not merely for decoration.
- **Reading-column tier:** Keep prose-connected and ordinary content within the `720px` reading column, including ordinary images and diagrams, code blocks, callouts, and ordinary tables. On a narrow viewport, this tier shrinks with the article and retains the approved `20px` horizontal gutter. If an otherwise ordinary table cannot fit, let the table's own container scroll horizontally rather than making the page scroll.
- **Outer-frame tier:** Allow a complex figure, large comparison, or wide table to expand up to the `1120px` outer page frame when the reader benefits from seeing the complete structure at once. Keep this tier centered within and aligned to the approved outer frame; it must shrink without causing page-level horizontal overflow on narrower viewports.
- **Viewport tier:** Allow a gallery, timeline, panorama, continuous comparison, or similar sequence that is meant to be browsed item by item to reach the viewport edges and scroll horizontally within its own component. Initially align the first item with the `720px` reading axis so entering and leaving the component preserves the article's single-axis composition; after the reader scrolls, items may reach the screen edges. The document itself must never gain horizontal scrolling from this treatment.
- **Selection rule:** Use `1120px` when one complete item or relationship should remain visible at once. Use viewport width with component-local scrolling when partial visibility and sequential exploration are intentional. Do not use the viewport tier as a generic way to make an ordinary image more dramatic.
- **Initial delivery boundary:** Until an explicit author-controlled width signal is separately specified and implemented, render every supported non-prose block in the `720px` reading-column tier. Do not infer a wider tier from source pixel dimensions, aspect ratio, file size, Notion layout, or component type. This is a staged product boundary, not a rejection or supersession of the accepted `1120px` and viewport tiers for a later release.
- **Reason or reference:** Yunfei selected the three-tier system after comparing the `720px` reading column, the `1120px` page frame, and an Antfu-blog-style photo strip that reaches the screen edges and scrolls horizontally. The tiers preserve Musubi's single reading axis while giving genuinely wide structures and continuous media distinct, predictable behaviors.

### Light-theme page background

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** The main page background in the light theme.
- **Decision:** Use pure white `#FFFFFF` for the main page background.
- **Reason or reference:** Follow the main page background of Kami's [white print introduction](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/assets/demos/demo-kami-print.html#L35-L72).

### Light-theme standard container surface

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The standard neutral background for components that require genuine containment in the light theme, including inline code, table headers, and neutral figure or diagram canvases. Fenced code blocks remain governed by their separate GitHub theme.
- **Decision:** Follow Kami and use warm off-white `#FAF9F5` as the standard light-theme container surface on the pure-white page background.
- **Usage boundary:** Article components remain led by lines and whitespace. Use this surface only when the component needs a contained region; do not turn ordinary article sections, index entries, links, files, or every callout into filled cards.
- **Reason or reference:** Yunfei accepted the shared surface while explicitly selecting a line-and-whitespace component system that avoids unnecessary cards.

### Dark-theme page background

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** The main page background in the dark theme.
- **Decision:** Follow Kami and use warm deep black `#141413` for the main page background.
- **Reason or reference:** Yunfei selected the exact Kami value after comparing it with the slightly lighter warm black `#1C1C1A` and soft charcoal `#242421` in the same local long-form article specimen. Kami defines `#141413` as its [dark-theme page background](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/references/design.md#L40-L47), with a slight olive undertone instead of pure black.

### Dark-theme standard container surface

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** The standard neutral background for contained components in the dark theme, including inline code and table headers. Fenced code blocks are excluded because their separately approved GitHub theme supplies its own surface. This decision selects the fill color only; container-specific text and borders are governed by the separate decisions below, while any demonstrated need for another surface remains open.
- **Decision:** Follow Kami and use warm charcoal `#30302E` as the standard dark-theme container surface on the `#141413` page background.
- **Usage boundary:** Use the surface to communicate real containment, not to turn ordinary article sections or index entries into filled cards. Prefer the page background and whitespace when a component does not need a contained surface.
- **Reason or reference:** Yunfei selected Kami's value after comparing `#1F1F1C`, the visually intermediate `#282825`, and `#30302E` in the same dark article specimen with inline code, code blocks, and table headers. Kami defines `#30302E` as its [dark-theme container](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/references/design.md#L40-L47).

### Light-theme warm-neutral text hierarchy

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Light-theme text colors across Musubi. The separate brand-accent decision controls links and other focused or structural accents.
- **Decision:** Follow Kami's four-level warm-neutral hierarchy. Use `#141413` for primary text such as headings, article body copy, and important content; `#3D3D3A` for secondary text such as navigation, table headers, and secondary interface copy; `#504E49` for supporting text such as summaries, ledes, descriptions, and blockquote text; and `#6B6A64` for tertiary text such as dates, categories, footnotes, and metadata. Assign colors by these roles instead of selecting a gray separately for each component, and do not add a fifth neutral text level without a demonstrated need.
- **Reason or reference:** Yunfei first selected Kami's `#141413` primary text after comparing it with the softer `#3D3D3A` in the same local long-form article specimen, then accepted Kami's complete role-based hierarchy. Kami defines the four levels in its [text color system](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/references/design.md#L51-L62), and its [white-print demo applies `#141413` to the document body](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/assets/demos/demo-kami-print.html#L44-L71).

### Dark-theme warm-neutral text hierarchy

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Text rendered directly on the dark-theme page background `#141413`. Text rendered on a different surface is outside this decision.
- **Decision:** Use four soft warm-neutral levels: `#E8E6DC` for primary text such as headings, article body copy, and important content; `#C9C7BE` for secondary text such as navigation and secondary interface copy; `#AAA8A0` for supporting text such as summaries, ledes, descriptions, and blockquote text; and `#898780` for tertiary text such as dates, categories, footnotes, and metadata. Assign colors by these roles and do not add a fifth neutral text level without a demonstrated need.
- **Surface boundary:** Do not automatically reuse these values on another surface. The separate standard-container hierarchy below verifies `#30302E`: it intentionally reuses the first three values but replaces `#898780`, which has sufficient contrast on `#141413` but not on `#30302E`. Any other surface still requires separate verification.
- **Reason or reference:** Kami defines the dark page background and the warm-neutral, four-level text principle but does not provide a complete inverse four-level palette for dark long-form prose. Yunfei selected the soft adaptation after comparing high-contrast, balanced, and soft variants in the same local desktop and mobile article specimen. Against `#141413`, the selected levels have contrast ratios of approximately `14.73:1`, `10.88:1`, `7.74:1`, and `5.13:1`, preserving clear hierarchy without making long-form text unnecessarily bright. The primary `#E8E6DC` is also Kami's existing warm-sand neutral.

### Dark-theme standard-container text hierarchy

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Warm-neutral text rendered directly on the approved dark-theme standard container `#30302E`. This hierarchy does not select syntax-highlighting colors or establish a second container surface.
- **Decision:** Reuse the approved dark-page hierarchy wherever it remains readable: `#E8E6DC` for primary text, `#C9C7BE` for secondary text, and `#AAA8A0` for supporting text. Use the container-safe `#9D9B93` for tertiary text and metadata instead of the page-level `#898780`. Assign the colors by the same four semantic roles used on the page rather than creating component-specific grays, and do not add another neutral text level without a demonstrated need.
- **Surface boundary:** These values are approved as a set on `#30302E`; using them on another surface still requires verification. The first three values are shared tokens by intent, while the fourth must remain a distinct on-container token because the page-level value does not meet ordinary-text contrast on this surface.
- **Reason or reference:** Yunfei selected the reuse option after comparing it with uniformly softer and uniformly clearer four-level palettes in the same standard-container specimens and in assembled inline-code, code-block, and table examples. Against `#30302E`, the selected colors have contrast ratios of approximately `10.57:1`, `7.81:1`, `5.55:1`, and `4.75:1`. This keeps the page and container hierarchy visually related while adding only the one value needed to keep tertiary container text readable.

### Brand accent color and standard usage

[VOUCHED @hyfdev 2026-07-19]

- **Date:** 2026-07-19.
- **Status:** Required.
- **Scope:** The shared chromatic brand seed, its light-theme value, and its normal design-system uses across Musubi. The dark theme uses the separate derivation decision below.
- **Decision:** Use Suō red `#A64156` as Musubi's only general-purpose chromatic brand accent. Apply it wherever a standard visual role needs to draw focus or mark structure, including links, keyboard focus indicators, active or current states, primary actions, short highlights, section markers, blockquote left rules, native list markers, and checked task boxes. Keep ordinary prose and large neutral surfaces out of the brand color. These standard uses inherit this decision and do not require separate component-by-component approval.
- **Task-checkbox state:** Keep unchecked task boxes neutral. A checked task box uses the current theme's shared brand accent and therefore follows the light seed and generated dark value automatically.
- **Callout boundary:** A Notion Callout's source-authored color does not select or override its Musubi semantic role. The separate accepted Callout decisions assign Note when no declaration is present, let an author declare Note, Warning, or Error explicitly, and render that role with icon-free GitHub Primer semantic rules that remain independent of this brand color.
- **Usage boundary:** Keep the brand color to a small portion of the page, approximately no more than `5%`. Discuss a use separately only when it would color a large surface, make ordinary prose red, introduce a source-independent hue, or apply the accent without a focus or structural purpose.
- **Reason or reference:** Yunfei selected this color because Suō is a documented historical Japanese red with a traceable dyeing history, giving Musubi's accent a genuine cultural story.
- **Revision rule:** Until Yunfei supersedes this decision, light-theme design work must use `#A64156`. If the seed changes later, replace the shared light-theme value consistently and rerun the accepted dark-theme derivation rather than creating component-specific color variants.

### Dark-theme brand-accent derivation

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** How Musubi turns its single light-theme brand seed into the single corresponding dark-theme brand color. This decision governs the shared brand value, not component-specific state treatments.
- **Decision:** Keep the light-theme brand color as the source of truth and generate the dark-theme brand color with the versioned derivation recorded in [the PCR record](./.agents/docs/dark-brand-color-derivation.md). The public derivation accepts one brand seed and returns one dark-theme brand color. The backgrounds where the result is actually used remain fixed internal Musubi context; they are not additional settings callers provide. Whenever the light-theme brand color changes, run the same derivation instead of choosing another color by eye.
- **Current result:** With seed `#A64156`, dark usage backgrounds `#141413`, `#30302E`, and `#26364B`, and algorithm v2, the generated dark-theme brand color is `#E78394`. This is the current calculated output, not a permanently selected substitute for the seed.
- **Regeneration:** Change the seed in the implementation, run `vp run brand:update`, inspect the regenerated light and dark themes, and commit the seed, generated CSS, and affected records together. A change to one of the checked usage backgrounds also requires regeneration.
- **Reason or reference:** Yunfei wants future brand-color changes to produce the corresponding dark-theme brand color automatically. The perceptual target follows the complete model and hue correction supplied with [Kim, Lee, and Suk's 2026 dark-mode brand-color experiment](https://doi.org/10.1371/journal.pone.0339392); Musubi then constrains the final sRGB value against its actual usages and [WCAG 2.2 contrast minimum](https://www.w3.org/TR/WCAG22/#contrast-minimum). The study limits and Musubi-specific safeguards are recorded in the linked PCR record.

### Light-theme border and divider hierarchy

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Neutral borders and dividers in the light-theme web interface. The dark theme uses the separate hierarchy below, while fenced code blocks use the separately approved GitHub-theme border.
- **Decision:** Adapt Kami's two-level border system for equal-width web lines. Use `#E8E6DC` for primary borders and dividers, and a visibly lighter `#F0EFE9` for secondary borders and dividers. Use the primary value for explicit thematic breaks such as Markdown `<hr>`, table-header boundaries, and other clear region boundaries. Use the secondary value for repeated row or item separators and quiet component boundaries. Assign the value by structural importance instead of choosing a new neutral for each component.
- **Usage boundary:** Ordinary borders and dividers remain neutral. Do not give them the brand color merely for decoration; the separate brand-accent decision still governs focused or intentionally accented structures such as keyboard focus, current states, section markers, and blockquote left rules.
- **Reason or reference:** Kami defines primary `#E8E6DC` and secondary `#E5E3D8` border tokens, but Yunfei found them almost indistinguishable when both were rendered as `1px` web lines. Yunfei selected `#F0EFE9` for the secondary web token so the visual result preserves the intended primary-versus-secondary hierarchy instead of mechanically copying two print-oriented values that read alike on screen.

### Dark-theme border and divider hierarchy

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Neutral borders and dividers rendered against the approved `#141413` dark page and `#30302E` standard container. Fenced code blocks are excluded because they use a separate GitHub-theme surface and border. This decision selects the value for each structural role when a border or divider is needed; it does not require every component to have a border and does not govern focus indicators or other brand-accent roles.
- **Decision:** Use `#4A4944` for primary borders and dividers, and `#383733` for secondary borders and dividers. Use the primary value for explicit thematic breaks, clear region or container boundaries, and other lines that need to establish structure. Use the secondary value for repeated row or item separators and quiet boundaries. When a clear boundary is needed within the `#30302E` container, use the primary value because the secondary value is intentionally subtle there. Assign values by structural importance instead of choosing a new neutral for each component.
- **Usage boundary:** Do not use either neutral as the sole indication of keyboard focus, selection, error, or another interactive state; those roles require their separately approved or verified treatment. Ordinary borders remain neutral rather than inheriting the brand color for decoration.
- **Reason or reference:** Yunfei selected the balanced option after comparing quiet, balanced, and clear pairs on both approved dark surfaces and in assembled code-block and table examples. The selected primary and secondary lines have approximate contrast ratios of `2.04:1` and `1.55:1` against `#141413`, and `1.47:1` and `1.11:1` against `#30302E`. The pair keeps explicit structure visible while allowing repeated lines to remain subdued in long-form reading.

### Chinese typography

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Chinese prose and Chinese interface text.
- **Decision:** Use Tsanger JinKai 02 W04 for Chinese body copy and ordinary Chinese interface text. Use Tsanger JinKai 02 W05 for Chinese titles, headings, and explicit emphasis.
- **Default status:** Use this W04/W05 pairing as Musubi's default Chinese typography for now. Do not select an OFL replacement while Yunfei is seeking confirmation from Tsanger.
- **Publication handling:** Proceed with the public Musubi implementation without making Tsanger confirmation a code or release gate; Yunfei will seek confirmation from the font author separately. Keep Tsanger as the preferred visual default and support generated webfont subsets in published deployments. The repository implementation may accept builder-supplied local source files rather than committing the upstream TTF files or automatically downloading them; this input boundary does not change the selected output typography.
- **License boundary:** This decision records Yunfei's implementation and release direction, not a factual claim that Musubi's MIT license relicenses third-party fonts. Keep third-party font notices and generated font artifacts outside the root MIT grant where applicable.
- **Reason or reference:** Yunfei selected the mixed variant after comparing all-W04, all-W05, and mixed variants against the same local Musubi list and article content. The typeface follows Kami's pinned [W04 and W05 font files](https://github.com/tw93/Kami/tree/f97bfc9ef83626edb863f6e42632067047a23601/assets/fonts).

### Chinese font delivery and runtime fallback

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** Generated Tsanger JinKai webfont artifacts for Musubi's static output and the LXGW WenKai GB runtime fallback delivered with the generated site. The original Tsanger TTF files do not need to enter the public repository because the build may receive them as local inputs.
- **Decision:** Generate content-derived WOFF2 subsets at build time instead of shipping the complete W04 and W05 files. Collect only code points that the accepted typography rules assign to Tsanger, including the relevant Han characters, Chinese punctuation, and full-width symbols in published content, site settings, navigation, metadata labels, generated empty and error states, and other Musubi-owned interface copy. Do not add Latin text or code symbols that the accepted rules assign to Charter or JetBrains Mono merely because they appear in the same source string.
- **Role assignment:** Build the two corpora from the actual rendered typography roles rather than from labels such as `title`. W04 includes Chinese body copy, ordinary interface text, and the separately approved W04 homepage article-list title exception. W05 includes only text whose accepted component rule assigns W05, such as long-form titles, headings, and explicit emphasis. If the same code point can render in both roles, include it in both subsets.
- **Font priority:** Use the CSS order generated Tsanger subset, `Musubi CJK Fallback`, then the appropriate system fallback. Always include and try the Tsanger face assigned by the accepted typography role first for every build-known code point that its source supports: W04 for its approved roles and W05 for its approved roles. Do not replace a complete build-known text run, or a build-known glyph covered by the assigned Tsanger source, with LXGW merely to simplify implementation. Text that first appears at runtime uses LXGW whenever its code point is absent from the deployed content-derived Tsanger subset, even if the complete Tsanger source would have supported that code point; this is an accepted consequence of keeping Tsanger content-derived.
- **Regeneration and publication:** Every static build derives or validates its subsets against the content, configuration, interface copy, source fonts, and subsetting tool used by that build. A newly published or edited first-party page does not reach the deployed site until another build runs; that build includes the page's characters. This decision does not choose whether a future build starts manually, from a webhook, on a schedule, or by another deployment mechanism.
- **Finite runtime vocabulary:** If a browser-time component can display only a finite set of site-owned strings, add every possible string to the build corpus explicitly even if a particular build does not render every variant into HTML.
- **Runtime fallback delivery:** Pin `LXGW WenKai GB Medium v1.522` as the single source for `Musubi CJK Fallback`. Preserve the pinned font's complete glyph coverage across a set of pre-generated WOFF2 shards instead of deriving LXGW coverage from the current build corpus or emitting only build-known Tsanger gaps. Declare explicit `unicode-range` coverage for the shards so the browser can request the relevant fallback files when static or runtime text needs them. Use the same Medium outlines after both W04 and W05 rather than synthesizing another weight or introducing a second fallback typeface. Complete coverage here means every glyph supported by the pinned LXGW source, not every Unicode code point.
- **Fallback caching:** Give the fallback shards stable versioned or content-addressed URLs and serve them with long-lived immutable caching. A shard already downloaded by a browser for the same deployed origin can be reused on later visits. Browser caches are not shared between different users and should not be assumed to transfer across different Musubi sites; a CDN cache can avoid another origin fetch but does not remove the new visitor's network transfer.
- **Fallback licensing and identity:** Keep the generated fallback shards separate from both Tsanger files. Give the modified shards the non-reserved internal family name `Musubi CJK Fallback`, retain their copyright and SIL Open Font License 1.1 metadata, ship the OFL text with the generated artifacts, and pin and checksum the upstream input. The selected input is the official [`LXGWWenKaiGB-Medium.ttf` from release `v1.522`](https://github.com/lxgw/LxgwWenKaiGB/releases/download/v1.522/LXGWWenKaiGB-Medium.ttf), SHA-256 `b885c51ec0d3f325974013801dfcefda1a9ba0bf385c607cf5f2582dafa2e5ab`.
- **Coverage validation:** A build-known code point present in its assigned Tsanger source must survive in the corresponding Tsanger subset; losing it is a build error. A build-known Chinese typography code point absent from Tsanger must be covered by the pinned LXGW source and its generated shard. The fallback shard set must preserve the complete mapped coverage of the pinned LXGW input. A required build-known code point absent from both pinned sources, a lost required mapping, or an invalid generated font stops the build. Emoji and characters intentionally outside the Chinese typography roles continue through their normal CSS fallback and do not fail this check.
- **Unbounded runtime behavior:** Text that first appears after deployment and whose complete character set cannot be known, such as future comments, user input, or client-fetched data, falls from the generated Tsanger subset to the relevant LXGW shard. This provides deterministic runtime coverage for every code point supported by the pinned LXGW source without a runtime glyph-generation service. A runtime code point outside both the deployed Tsanger subset and LXGW coverage continues to the appropriate system fallback. Third-party iframe embeds keep their own typography and are outside Musubi's font stack.
- **Reason or reference:** This preserves the selected W04/W05 appearance for build-known content while giving unknown runtime content a visually related, deterministic fallback instead of relying immediately on a device-dependent system font. Yunfei explicitly selected content-derived Tsanger subsets plus complete, pre-sharded, long-cache LXGW runtime coverage after reviewing the local full-paragraph, enlarged-glyph, single-glyph transition, and real missing-glyph specimens. Actual font inspection found that LXGW WenKai GB Medium and its Screen counterpart use nearly identical normalized CJK outlines: `30,554` of `30,558` shared inspected CJK glyphs differed only by scaling-rounding noise, while four had structural outline differences. The direct Medium source retains `1000` units per em and the same OS/2 `880/-120` typographic ascent and descent values as Tsanger instead of importing the Screen edition's Roboto-oriented `2048`-unit metrics. These OS/2 values do not guarantee identical browser line boxes because neither font enables `USE_TYPO_METRICS` and their `hhea` metrics differ; they make Medium the simpler source input, not a promise of zero layout difference. Its inspected Han coverage is a strict superset of Tsanger's and includes every Tsanger-missing character in the CJK basic and Extension A blocks. The GB edition follows Simplified Chinese forms, and its Medium density is close to Tsanger W04 while remaining an acceptable fallback within W05. The two Tsanger source TTF files total about `36.15 MiB`; one local experiment against the prepared Musubi corpus produced role-specific Tsanger WOFF2 subsets totaling about `139 KiB`. A separate local experiment preserving the LXGW source's CJK coverage in one WOFF2 produced `8,228,416` bytes (`7.8 MiB`), which is why runtime coverage is pre-sharded instead of delivered as one file. These measurements are evidence, not fixed production budgets, because content and font tooling will change them.

### English typography

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** English prose and English interface text.
- **Decision:** Follow Kami: use Charter as the primary typeface for English headings, body copy, labels, metadata, and other interface text, with Georgia, Palatino, and Times New Roman as fallbacks. Do not introduce a separate sans-serif family for ordinary English interface text.
- **Reason or reference:** Yunfei selected the Charter treatment after reviewing the local English and mixed-language Musubi specimen. Kami specifies [Charter for English pages](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/README.md#L142) and uses one serif family across the page.

### Strong emphasis in article prose

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Markdown `**strong emphasis**` rendered as `<strong>` in article prose in both themes.
- **Decision:** Combine the already-selected emphasis typography with the shared brand color. Chinese strong text uses Tsanger JinKai 02 W05; Latin strong text keeps Charter and its strong treatment. Both use the current brand color, with no underline and no background fill. In the current light theme, that shared brand value is `#A64156`.
- **Token coupling:** The color must reference the same theme-appropriate semantic brand-color token used by links and the other approved brand roles. Do not hard-code either theme's current hex or create a strong-specific color token. If the brand seed changes later, strong emphasis must change with the regenerated theme values automatically.
- **Usage boundary:** This rendering inherits the existing brand-color restraint and its short-highlight role. Because Markdown `**...**` maps directly to `<strong>`, emphasized text still counts toward the brand-color area rather than becoming ordinary colored prose.
- **Reason or reference:** Yunfei selected W05 plus the brand accent after comparing W05 alone, W05 plus color, a pale background, and Chinese emphasis dots in the same desktop and mobile article context. The selected treatment makes emphasis visible without adding another surface or decoration.

### Article body reading system

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** The base body copy, line height, letter spacing, spacing between adjacent paragraphs, and prose-column width of long-form articles on the web. This does not set heading typography or the widths of the article header, media, or other components. The separate outer-page-frame decision sets the shared shell width.
- **Decision:** Use `17px` base body text with a `28px` line height and `16px` between adjacent paragraphs, and cap the prose column at `720px`. Use `0.015em` letter spacing for Chinese body copy and `0` for English body copy. Treat `720px` as a maximum: on narrower viewports, the prose column must shrink rather than remain fixed or overflow, while retaining at least `20px` of horizontal space between the main article content and each viewport edge. On wider viewports, center the column and let the remaining space form its margins automatically.
- **Reason or reference:** Yunfei selected `17px` after comparing `16px`, `17px`, and `18px`, selected `28px` after comparing `26px`, `28px`, and `30px`, selected `16px` paragraph spacing after comparing `16px`, `20px`, and `24px`, selected `0.015em` Chinese letter spacing after comparing `0.01em`, `0.015em`, and `0.02em`, and selected a `20px` minimum narrow-screen gutter after distinguishing it from the automatic margins around a centered `720px` maximum-width column. At `17px`, `0.015em` computes to `0.255px`, or about `0.19pt`, near the upper end of Kami's [Tsanger JinKai body-text range](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/references/design.md#L181-L187). The line height is about `1.65`, consistent with Kami's [screen typography ranges](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/references/design.md#L165-L175). The paragraph spacing preserves the roughly one-body-size gap in Kami's [long-document paragraphs](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/assets/templates/long-doc.html#L240-L246) while using Kami's `4px` screen spacing unit. The maximum follows Kami's screen-only documentation guidance to constrain prose to a reading measure of [about `720px`](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/references/design.md#L1297-L1302).
- **Component relationship:** The separate long-form article-component decision governs non-prose styling, caption placement, and the vertical spacing of figures and callouts.

### Long-form article heading scale

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** The H1, H2, and H3 hierarchy of long-form articles on the web.
- **Decision:** Use `32px` for H1, `27px` for H2, and `22px` for H3. The separate article-header-content decision caps the H1 at the same `720px` width as the prose. Prefer a single line when the title naturally fits, but if it exceeds that width, let it wrap automatically at normal line-breaking opportunities. Do not use `white-space: nowrap`, clip or overflow the title, or shrink its text solely to keep one line.
- **Reason or reference:** Yunfei accepted `32px / 27px / 22px` as a complete heading scale after reviewing the three levels together and comparing `32px`, `35px`, and `38px` H1 variants with the same title and header width. The H1 does not need size alone to establish hierarchy: Tsanger JinKai 02 W05, its position, surrounding whitespace, and nearby structural elements also provide emphasis. The smaller H1 is friendlier on mobile. Yunfei explicitly reconfirmed that a single-line title is desirable when it fits, but that an overlong title must wrap normally rather than being forced onto one line.

### Supporting headings and emphasis

[VOUCHED @hyfdev 2026-07-16]

- **Date:** 2026-07-16.
- **Status:** Required.
- **Scope:** H4 and H5 inside long-form prose, plus Markdown emphasis rendered as `em`. Strong emphasis remains governed by its separate brand-colored decision.
- **Heading continuation:** Continue the accepted `32px / 27px / 22px` hierarchy with H4 at `19px` on a `28px` line and H5 at the `17px` body size on a `28px` line. Use W05 for Chinese and Charter for Latin headings. Place `24px` before and `8px` after H4, and `20px` before and `8px` after H5. Do not create an H6 visual level in the initial system.
- **Emphasis:** Render Latin `em` in Charter italic. Render Chinese `em` upright in Tsanger JinKai W05 because synthetic Chinese italics distort the chosen letterforms; the weight and drawing change supplies emphasis without brand color. Keep `em` neutral so it remains distinct from brand-colored `strong`.
- **Reason or reference:** Yunfei asked to use the recommended H4/H5 continuation and mixed-language emphasis treatment, then inspected the hierarchy in a real article and the plain/`em`/`strong` distinction in a focused comparison. He decided that Notion Italic's conventional Markdown-to-`em` mapping does not warrant a separate design decision or acceptance gate. The sizes extend the accepted scale without introducing an abrupt jump below H3, while the language-aware treatment remains a quiet default rather than another prominent emphasis style. Verifying the W04-to-W05 Chinese rendering in an artifact with Tsanger subsets is part of the recorded font implementation issue and does not reopen this design decision.

### Article header content width

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** The textual header content of long-form article pages: H1, optional lede, and metadata. The long divider below the article header remains outer-frame structure under the separate page-structure decision.
- **Decision:** Cap the H1, optional lede, metadata, and article prose at the same `720px` maximum and align both their left and right boundaries. Keep a title on one line when it naturally fits; otherwise let it wrap at normal line-breaking opportunities. Do not widen the title to the `1120px` outer frame merely to avoid wrapping, shrink its type, truncate it, clip it, or force it to remain on one line.
- **Narrow viewports:** Shrink the shared content column fluidly and retain the approved `20px` horizontal gutter. The title follows the same responsive width as the prose rather than introducing a separate narrow-screen rule.
- **Reason or reference:** Yunfei chose the shared `720px` width after reconsidering the earlier demonstrated `920px` title region. Once natural wrapping was accepted, the wider title no longer served a necessary reading function. Keeping the full textual header on the prose column better supports the accepted single-axis, one-sheet composition; the `1120px` frame remains available for navigation, the article-header divider, and genuinely wide non-prose content.

### Long-form article vertical rhythm

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Vertical spacing among headings and common block-level elements in long-form web articles. The separate article-body decision continues to control the `16px` gap between adjacent prose paragraphs.
- **Decision:** Follow a web conversion of Kami's long-document spacing proportions. Use `40px` before and `12px` after H2; `28px` before and `8px` after H3; `8px` before and `16px` after unordered and ordered lists, with no additional gap between adjacent list items; `20px` above and below blockquotes; `16px` above and below fenced code blocks; and `20px` above and below tables. For a Markdown thematic break rendered as `<hr>`, use the accepted web-specific spacing of `40px` before and `24px` after.
- **Conversion rule:** Preserve the relationship to Kami's `10.5pt` long-document body rather than treating print points as CSS pixels. Scale Kami's H2 `24pt / 8pt`, H3 `18pt / 6pt`, and component margins to Musubi's `17px` web body, then round to the existing `4px` web spacing grid.
- **Boundary:** Kami's long-document template does not define an `<hr>` rule, so the `<hr>` spacing is a Musubi web decision rather than a claimed Kami value. The separate article-component decision governs images, figures, callouts, and width-tier transitions.
- **Reason or reference:** Yunfei selected the explicit Kami-proportional mode after comparing it with compact, web-balanced, and airy variants in the same desktop and mobile long-form article. The source proportions come from Kami's [long-document headings and common block elements](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/assets/templates/long-doc.html#L213-L320).

### Long-form article component treatment

[VOUCHED @hyfdev 2026-07-15]

- **Date:** Selected 2026-07-15; table-of-contents treatment revised and accepted 2026-07-16.
- **Status:** Required.
- **Scope:** The visual grammar, caption alignment, and vertical spacing of figures, galleries, tables, callouts, table of contents, file attachments, and external-link rows in long-form articles. The separate width-hierarchy decision continues to choose among the `720px`, `1120px`, and viewport tiers.
- **Visual grammar:** Lead with lines and whitespace rather than filled cards. Use a neutral surface only where real containment is necessary under the approved surface decisions.
- **Callouts:** Keep callouts in the `720px` reading column and continue the accepted line-led treatment without turning them into filled cards. Every Callout has one of the accepted Note, Warning, or Error roles: use Note by default and use the explicit first-line declaration when present. Do not infer the role from the Notion color, icon, or prose, and do not let the source color override the selected semantic role. Retain source metadata in the content model while rendering the separate accepted visible-label, icon-free, GitHub Primer semantic-line presentation below.
- **Figures and captions:** Keep ordinary figures in the `720px` reading column, allow genuinely complex figures to use the `1120px` tier, and use viewport-edge local scrolling only for continuous media that is meant to be explored item by item. Return the overall caption of a wide figure to the `720px` reading axis. Keep each gallery item's own caption directly attached to that item.
- **Table of contents:** Keep a single vertical column at every viewport width. The Notion-style titleless list with persistent underlines and `24px` cumulative indentation was rejected after live review because its nested items moved too far across the reading column and the repeated underlines made the directory visually abrupt. The following neutral-surface container with a brand left rule was also rejected: despite its subtler `12px` steps, it reused Musubi's Callout grammar and lacked a visible identity, so it did not read as a table of contents. The next editorial-index candidate added a neutral top rule, but it was rejected because it visibly duplicated the existing article-header divider when the TOC appeared near the beginning of a Post. The accepted replacement draws no container or rule and relies on a visible `Contents` label, stronger top-level entries, compact child rows, `8px` only between top-level groups, and `12px` nested steps. Resting links remain unadorned and brand color appears only during interaction. This treatment is sufficient for the initial version; future refinement requires a new decision rather than reopening the current delivery.
- **Tables, files, and links:** Use a restrained table header and horizontal row separators. Let a wide table scroll within its own container. Render file attachments and external-link references as quiet list rows with separators rather than application-style cards.
- **Spacing:** Use approximately `20px` above and below ordinary article components. Use `28px` around a figure or gallery that leaves the reading column for the `1120px` or viewport tier so the transition away from and back to the prose axis remains clear.
- **Reason or reference:** Yunfei accepted the combined rich-article specimen after comparing line-led and filled containers, reading-axis and media-edge captions, and desktop multi-column versus single-column tables of contents. He selected line-and-whitespace structure, reading-axis wide captions, and a single-column table of contents. During the whole-site review he rejected the initial left-ruled rendering because its deep staircase and always-blue links were too strong, then rejected both a flattened neutral replacement and the later Notion-style persistent-underlined list. A subsequent neutral surface with a brand line still felt wrong because it looked like another Callout rather than navigation, and a top rule visibly duplicated the nearby article-header divider. The current index treatment gives the component an explicit name and uses grouping, typography, and shallow indentation alone to express its structure without introducing another container or separator. Yunfei confirmed this result as sufficient for the initial version and deferred optional optimization. He rejected semantics inferred from Notion's Callout icon, color, or text because Notion supplies no equivalent semantic type, then selected a Musubi-owned Note default with explicit author declarations for Warning and Error.

### X post embeds

[VOUCHED @hyfdev 2026-07-16]

This decision was superseded for the initial implementation by **X post URL-only rendering** on 2026-07-18. It remains as historical design exploration rather than current behavior.

- **Date:** 2026-07-16.
- **Status:** Required.
- **Scope:** A Notion unknown or tweet block that the source adapter resolves to a canonical public X status URL. This decision does not approve other embed providers or make arbitrary remote HTML trusted content.
- **Reference direction:** Follow the useful division in `antfu/antfu.me`: keep X's official widget for the familiar rendered post rather than attempting to imitate every part of it. Adapt that reference to Musubi's static and failure-tolerant architecture instead of requiring authors to paste an official blockquote or making the provider iframe the only readable result.
- **Build-time representation:** Request the fixed official X Publish oEmbed endpoint without an X API token only to produce the static readable representation. Verify that the response matches the requested status and a supported X author profile, then convert only text, line breaks, and safe links into Musubi-owned inline nodes. Bound concurrency, time, response size, node count, and text length. Never render the returned HTML directly. This bounded oEmbed enrichment is the only X-related network request allowed during generation and must not be used to derive widget height. Do not make any build-time network request or launch a local or remote browser to calculate the official widget's height. Any future height reservation must come from deterministic local content, configuration, or defaults, and missing height information must not block publication.
- **Browser enhancement:** Load X's official widget script only when an enriched X component is present, including after a development-time client navigation; do not require Nuxt's production client runtime. Create the post with data non-use enabled and conversation context hidden. Treat the resolved Light or Dark palette as the widget theme. When System changes its resolved palette or the reader selects another mode, keep the current widget visible and usable while a matching replacement is created in a same-width, visually hidden staging container. Replace the old widget only after the new one has rendered successfully; do not reveal the static quotation or collapse the component during this theme-only rebuild.
- **Fallback hierarchy:** Generated HTML must contain the complete static author name, handle, post text, publication label, and external X link after successful build-time enrichment. Hide that quotation only after the first official widget returns a real rendered result. If the first widget is blocked, late, unavailable, or cannot render the post, keep the complete quotation visible. If a later theme-matching rebuild fails, retain the previous usable widget rather than falling back or leaving the component empty. If build-time oEmbed enrichment itself fails, keep an ordinary safe link and the containing article rather than failing publication.
- **Visual treatment:** Do not restyle the provider iframe. Keep Musubi's static quotation within the `720px` reading axis on the page canvas, with one quiet neutral border, restrained `6px` radius, existing typography roles, and no X-specific accent color, large logo, shadow, or application-card treatment. Exact internal spacing may be refined during visual acceptance without changing the enhancement and fallback contract.
- **Privacy boundary:** Data non-use reduces X's use of widget data but does not remove the third-party browser request. Documentation must state that an enriched X page contacts X when JavaScript enhancement runs; routes without an enriched X post must not load the script.
- **Reason or reference:** Yunfei asked to inspect how `antfu/antfu.me` renders X posts and then directed Musubi to proceed with that official-widget direction. Musubi adds the static representation, safe parser, theme recreation, and local failure isolation required by its accepted production architecture.

### X post URL-only rendering

[VOUCHED @hyfdev 2026-07-18]

- **Date:** 2026-07-18.
- **Status:** Required for the initial implementation; supersedes **X post embeds** above.
- **Scope:** Notion X or tweet embeds that resolve to canonical public X status URLs.
- **Decision:** Persist only the source URL in Notion Data and render it as an ordinary safe external link within the reading column. Do not request X metadata, oEmbed HTML, post dimensions, or widget resources during Notion refresh, static generation, or browser rendering. Do not calculate or reserve provider-widget height.
- **Boundary:** A future browser-only enhancement may be considered separately, but it must retain the usable static link, remain optional, and leave the snapshot and publication contracts unchanged.
- **Reason or reference:** Yunfei chose to stop work on X-specific rendering and keep the first production architecture simple after the widget and height behavior continued to feel unstable.

### Semantic Callout types and declaration syntax

[VOUCHED @hyfdev 2026-07-15]

- **Date:** 2026-07-15.
- **Status:** Required.
- **Scope:** The semantic role and optional author-supplied declaration attached to an existing Notion Callout. This does not define an alternative Markdown container syntax and does not derive a type from Notion presentation metadata.
- **Supported roles:** Support Note, Warning, and Error. When no declaration is present, assign Note. The default is a Musubi authoring rule, not an inference from the Callout's source color, icon, or text.
- **Two forms:** Provide a contextual shortcut and a complete declaration for every supported role: `{note}` and `{type=note}`, `{warning}` and `{type=warning}`, and `{error}` and `{type=error}`. Each shortcut is a fixed short form of its paired complete declaration; the two forms express identical author intent.
- **Marker position:** Inspect only the first content line. Ignore leading whitespace before a candidate declaration, then recognize a declaration only when the line begins with one complete supported brace form. Remove a recognized declaration from rendered prose, retain any ordinary text after it, and do not scan the remainder of the first line or later lines for another declaration.
- **Canonical and accepted spelling:** Documentation and generated content use one of the six compact lowercase forms: `note`, `warning`, `error`, `type=note`, `type=warning`, or `type=error`. Leading whitespace before the opening brace, whitespace immediately inside either brace, whitespace around `=`, and ASCII letter case are normalized for recognition. Thus `{warning}`, `{ warning }`, and `{ type = WARNING }` express the same Warning role.
- **Ordinary-brace behavior:** A first line that does not begin with one of the six complete supported declarations remains ordinary visible text and receives the default Note role. This includes unsupported forms such as `{info}`, malformed forms such as `{warning`, and brace-like prose elsewhere in the Callout. Do not fail the build, guess a nearby role, or require a separate literal-escape syntax. An author who genuinely wants ordinary first-line brace text can write an unsupported form such as `{info}` and it remains content.
- **Presentation precedence:** The selected role, whether explicit or the Note default, controls the separately accepted semantic Callout presentation. A Notion source color or icon does not override it.
- **Image boundary:** No image-width marker or value is selected yet. When explicit image-layout authoring is designed later, it must follow the same pattern of a contextual shortcut paired with a complete `{key=value}` declaration; this decision does not preselect `{wide}`, `layout`, or any other image vocabulary.
- **Reason or reference:** Yunfei wants frequent authoring to remain short without making the durable meaning depend on an opaque class name or an undocumented guess. The complete form states the semantic field explicitly, while the Callout-specific shortcut preserves a low-friction writing path. Recognizing only the supported first-line declarations makes parsing deterministic without turning unrelated brace text into a build error or requiring authors to remember an escape convention. The braces and key-value form follow the established attribute-list family, while the shortcuts are intentionally Musubi conveniences rather than claimed Markdown standards.

### Semantic Callout presentation

[VOUCHED @hyfdev 2026-07-16]

- **Date:** 2026-07-16.
- **Status:** Required.
- **Scope:** The rendered visual treatment of Note, Warning, and Error Callouts in light and dark themes. The separate declaration decision controls how the role is authored, and the long-form component decision continues to control the reading width and surrounding spacing.
- **Structure:** Keep the accepted transparent, line-led Callout. Use one `2px` left rule as its only semantic-colored element. Do not add a filled semantic surface, enclosing card border, source icon, replacement semantic icon, badge, or other role decoration.
- **Visible labels:** Display the English role label `Note`, `Warning`, or `Error` above the Callout content. Render the label and body with their approved theme-neutral text roles rather than the semantic color or the brand color. The visible label carries the role in text so color is not the only way the reader receives the meaning.
- **Light-theme semantic rules:** Use GitHub Primer's functional foreground role values directly: Note maps to accent blue `#0969DA`, Warning maps to attention amber `#9A6700`, and Error maps to danger red `#D1242F`.
- **Dark-theme semantic rules:** Use GitHub Primer's functional foreground role values directly: Note maps to accent blue `#4493F8`, Warning maps to attention amber `#D29922`, and Error maps to danger red `#F85149`.
- **Accessibility boundary:** Because the semantic colors apply to the non-text left rule rather than small label text, Musubi applies the `3:1` non-text visual-indicator contrast target to that rule. The accepted Primer values each exceed `3:1` against the approved `#30302E` dark container as well as the darker `#141413` page; the neutral label and body continue to follow the separately approved text-contrast hierarchy. Keep the visible role label even when color perception or custom styling makes the three rules harder to distinguish.
- **Brand separation:** These semantic colors do not derive from the brand seed, do not change when the brand seed changes, and do not use the dark-brand perceptual model. Their meaning and dual-theme values come from Primer's semantic roles; the brand derivation remains limited to brand-accent usages.
- **Reference:** The mapping follows the current [Primer functional color roles](https://primer.style/product/primitives/color/) and [Primer guidance that meaning must not rely on color alone](https://primer.style/product/components/label/accessibility/). Musubi's targets follow WCAG 2.2's separate requirements for [ordinary-text contrast](https://www.w3.org/TR/WCAG22/#contrast-minimum) and [non-text contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast).
- **Reason or reference:** Yunfei accepted the focused article specimen in desktop and narrow-screen light and dark themes after comparing direct Primer semantic rules with neutral labels against the established Musubi typography, whitespace, page backgrounds, and line-led component grammar. Keeping the color on the rule preserves Primer's familiar blue, amber, and red roles without turning the Callout into a GitHub-style filled alert or weakening the neutral paper-like reading surface.

### Callout source icon and color are model-only

[VOUCHED @hyfdev 2026-07-21]

- **Ruling:** Parse and retain a Notion Callout's source `icon` and `color` on the Musubi Callout AST node, and never render either field in the public site.
- **Limits:** This does not change the accepted Note / Warning / Error role rules, the English role label, or the Primer left-rule presentation. Other Notion presentation attributes (table fit/alignment/colors, table-of-contents color, image title) are outside this entry unless a separate decision covers them.
- **Why:** Yunfei confirmed the existing direction: Callout meaning comes only from the Musubi semantic role, not from Notion's icon or color chrome; keeping the fields on the AST must not be mistaken for a missing renderer.
- **Source:** Yunfei, 2026-07-21, local audit of parsed-but-unrendered Callout fields; inherits [Semantic Callout presentation](#semantic-callout-presentation) and [Long-form article component treatment](#long-form-article-component-treatment).

### Code typography and inline code

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** The shared typography of inline and fenced code, plus the light-theme surface treatment of inline code. Fenced code-block colors, surfaces, borders, labels, and overflow behavior are governed by the separate decision below.
- **Decision:** Follow Kami for code typography: use JetBrains Mono for Latin code and Tsanger JinKai 02 W04 as the Chinese fallback. In the light theme, inline code uses the warm `#FAF9F5` surface without a border. Keep inline code quiet and visually part of the sentence rather than making it look like a label or control.
- **Supersession boundary:** The earlier application of Kami's `#FAF9F5` surface and `#E8E6DC` border to fenced code blocks is superseded by the dual-theme GitHub decision below. The approved typefaces and the separate block-spacing decision remain in force.
- **Reason or reference:** Yunfei selected the shared typefaces and Kami inline-code treatment after reviewing them in the local English, inline-code, code-block, and mixed-language specimen. The inline details follow Kami's pinned [inline-code treatment](https://github.com/tw93/Kami/blob/f97bfc9ef83626edb863f6e42632067047a23601/assets/templates/long-doc.html#L285-L310).

### Fenced code-block reading treatment

[VOUCHED @hyfdev 2026-07-14]

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** Fenced code blocks in light, dark, system-selected, and narrow-screen presentation. This decision covers syntax colors and font styles, the block surface and border, the optional language label, and horizontal overflow. It does not alter inline code.
- **Decision:** Prioritize fast code reading over strict visual continuity with the article palette. Use Shiki's complete built-in `github-light` theme in the light theme and `github-dark` in the dark theme. Preserve each theme's syntax colors and token font styles instead of compressing or remapping them to Musubi's neutral hierarchy or brand color. Use the approved theme presentation: a `#FFFFFF` surface with `#E1E4E8` border in light mode and a `#24292E` surface with `#1B1F23` border in dark mode.
- **Behavior:** Keep the optional language label outside the horizontally scrolling region. Do not wrap code on screen; when a line is wider than the block, scroll the code locally without creating document-level horizontal overflow.
- **DESIGN.md relationship:** Translate this decision into the exact theme identifiers, surfaces, borders, token-style preservation, label placement, and overflow behavior. The syntax-highlighting package version and build pipeline remain implementation choices as long as the rendered result follows this contract.
- **Supersession boundary:** This decision supersedes only the fenced code-block palette and container portions of the earlier Kami code and dark-container decisions. The approved code typefaces, `720px` default content tier, and `16px` vertical block spacing remain unchanged, and the inline-code contrast question remains open.
- **Reason or reference:** Yunfei selected the exact GitHub theme pair after reviewing real TypeScript, Git, and Bash code blocks in both color modes and on a narrow screen. Code is primarily a reading tool, so familiar syntax differentiation and scanability take priority over making the block resemble the surrounding editorial surface.

### Inline-code contrast

- **Date:** 2026-07-14.
- **Status:** Open.
- **Scope:** Inline code on the pure-white light-theme page background.
- **Observation:** The Kami `#FAF9F5` inline-code surface without a border feels faint against `#FFFFFF`.
- **Current handling:** Keep the vouched Kami treatment unchanged for now.
- **Open question:** Later decide whether to strengthen the background, text, or boundary without making inline code look like a label or control.

### Print presentation

[VOUCHED @hyfdev 2026-07-16]

- **Date:** 2026-07-16.
- **Status:** Rejected for the current product scope.
- **Scope:** Dedicated `@media print` styling, print-only layout changes, and claims that Musubi provides a designed print output.
- **Decision:** Do not provide a print-specific presentation in the current design system. Musubi may still be printed using browser defaults, but the repository must not maintain a separate print palette, hide or rearrange components for print, or treat print output as an accepted feature.
- **Reason or reference:** Yunfei explicitly removed print support from the current scope. Kami remains the visual source for the white, type-led screen direction; its original print purpose does not require Musubi to reproduce a print product.

## Recording format

Add each requirement or decision under `Decisions` with:

- **Date:** When Yunfei stated or selected it.
- **Status:** Required, preferred, rejected, open, or superseded.
- **Scope:** The pages, themes, content, or components it covers.
- **Decision:** What Yunfei wants or does not want, in plain language.
- **Reason or reference:** Include only when Yunfei provided one.

Do not fill missing fields by guessing. Leave an unresolved choice open until Yunfei decides it.