---
version: alpha
name: Musubi
description: A quiet, paper-like editorial system for multilingual technical writing on the web.
colors:
  canvas-light: '#FFFFFF'
  surface-light: '#FAF9F5'
  text-primary-light: '#141413'
  text-secondary-light: '#3D3D3A'
  text-supporting-light: '#504E49'
  text-tertiary-light: '#6B6A64'
  border-primary-light: '#E8E6DC'
  border-secondary-light: '#F0EFE9'
  primary: '#A64156'
  canvas-dark: '#141413'
  surface-dark: '#30302E'
  text-primary-dark: '#E8E6DC'
  text-secondary-dark: '#C9C7BE'
  text-supporting-dark: '#AAA8A0'
  text-tertiary-dark: '#898780'
  text-tertiary-on-surface-dark: '#9D9B93'
  border-primary-dark: '#4A4944'
  border-secondary-dark: '#383733'
  primary-dark: '#E78394'
  note-light: '#0969DA'
  warning-light: '#9A6700'
  error-light: '#D1242F'
  note-dark: '#4493F8'
  warning-dark: '#D29922'
  error-dark: '#F85149'
  code-canvas-light: '#FFFFFF'
  code-border-light: '#E1E4E8'
  code-text-light: '#24292E'
  code-label-light: '#6A737D'
  code-canvas-dark: '#24292E'
  code-border-dark: '#1B1F23'
  code-text-dark: '#E1E4E8'
  code-label-dark: '#959DA5'
typography:
  heading-1:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W05', 'Musubi CJK Fallback', serif"
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.28
    letterSpacing: 0em
  heading-2:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W05', 'Musubi CJK Fallback', serif"
    fontSize: 27px
    fontWeight: 500
    lineHeight: 36px
    letterSpacing: 0em
  heading-3:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W05', 'Musubi CJK Fallback', serif"
    fontSize: 22px
    fontWeight: 500
    lineHeight: 32px
    letterSpacing: 0em
  heading-4:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W05', 'Musubi CJK Fallback', serif"
    fontSize: 19px
    fontWeight: 500
    lineHeight: 28px
    letterSpacing: 0em
  heading-5:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W05', 'Musubi CJK Fallback', serif"
    fontSize: 17px
    fontWeight: 500
    lineHeight: 28px
    letterSpacing: 0em
  home-title:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W04', 'Musubi CJK Fallback', serif"
    fontSize: 20px
    fontWeight: 400
    lineHeight: 30px
    letterSpacing: 0em
  body-latin:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0em
  body-cjk:
    fontFamily: "'Tsanger JinKai W04', 'Musubi CJK Fallback', serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0.015em
  supporting:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W04', 'Musubi CJK Fallback', serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
    letterSpacing: 0em
  interface:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W04', 'Musubi CJK Fallback', serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0em
  metadata:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W04', 'Musubi CJK Fallback', serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0em
  micro-label:
    fontFamily: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, Palatino, 'Times New Roman', 'Tsanger JinKai W04', 'Musubi CJK Fallback', serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0em
  code:
    fontFamily: "'JetBrains Mono', SFMono-Regular, Consolas, 'Tsanger JinKai W04', 'Musubi CJK Fallback', monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 23px
    letterSpacing: 0em
rounded:
  none: 0px
  inline: 3px
  small: 4px
  code: 6px
  large: 8px
  full: 9999px
spacing:
  unit: 4px
  xs: 8px
  sm: 12px
  paragraph: 16px
  component: 20px
  wide-component: 28px
  section: 40px
  group: 48px
  page: 64px
  mobile-gutter: 20px
  reading-width: 720px
  frame-width: 1120px
  header-desktop: 60px
  header-mobile: 88px
components:
  header-light:
    backgroundColor: '{colors.canvas-light}'
    textColor: '{colors.text-secondary-light}'
    height: '{spacing.header-desktop}'
  header-dark:
    backgroundColor: '{colors.canvas-dark}'
    textColor: '{colors.text-secondary-dark}'
    height: '{spacing.header-desktop}'
  footer-light:
    backgroundColor: '{colors.canvas-light}'
    textColor: '{colors.text-tertiary-light}'
    typography: '{typography.metadata}'
    height: '{spacing.header-desktop}'
  footer-dark:
    backgroundColor: '{colors.canvas-dark}'
    textColor: '{colors.text-tertiary-dark}'
    typography: '{typography.metadata}'
    height: '{spacing.header-desktop}'
  inline-code-light:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.text-primary-light}'
    rounded: '{rounded.inline}'
  inline-code-dark:
    backgroundColor: '{colors.surface-dark}'
    textColor: '{colors.text-primary-dark}'
    rounded: '{rounded.inline}'
  code-block-light:
    backgroundColor: '{colors.code-canvas-light}'
    textColor: '{colors.code-text-light}'
    typography: '{typography.code}'
    rounded: '{rounded.code}'
  code-block-dark:
    backgroundColor: '{colors.code-canvas-dark}'
    textColor: '{colors.code-text-dark}'
    typography: '{typography.code}'
    rounded: '{rounded.code}'
  navigation-current-light:
    backgroundColor: '{colors.canvas-light}'
    textColor: '{colors.primary}'
    typography: '{typography.interface}'
  navigation-current-dark:
    backgroundColor: '{colors.canvas-dark}'
    textColor: '{colors.primary-dark}'
    typography: '{typography.interface}'
  supporting-copy-light:
    backgroundColor: '{colors.canvas-light}'
    textColor: '{colors.text-supporting-light}'
    typography: '{typography.supporting}'
  supporting-copy-dark:
    backgroundColor: '{colors.canvas-dark}'
    textColor: '{colors.text-supporting-dark}'
    typography: '{typography.supporting}'
  metadata-on-surface-dark:
    backgroundColor: '{colors.surface-dark}'
    textColor: '{colors.text-tertiary-on-surface-dark}'
    typography: '{typography.metadata}'
  divider-primary-light:
    backgroundColor: '{colors.border-primary-light}'
    height: 1px
  divider-secondary-light:
    backgroundColor: '{colors.border-secondary-light}'
    height: 1px
  divider-primary-dark:
    backgroundColor: '{colors.border-primary-dark}'
    height: 1px
  divider-secondary-dark:
    backgroundColor: '{colors.border-secondary-dark}'
    height: 1px
  callout-note-rule-light:
    backgroundColor: '{colors.note-light}'
    width: 2px
  callout-warning-rule-light:
    backgroundColor: '{colors.warning-light}'
    width: 2px
  callout-error-rule-light:
    backgroundColor: '{colors.error-light}'
    width: 2px
  callout-note-rule-dark:
    backgroundColor: '{colors.note-dark}'
    width: 2px
  callout-warning-rule-dark:
    backgroundColor: '{colors.warning-dark}'
    width: 2px
  callout-error-rule-dark:
    backgroundColor: '{colors.error-dark}'
    width: 2px
  code-label-light:
    backgroundColor: '{colors.code-canvas-light}'
    textColor: '{colors.code-label-light}'
    typography: '{typography.micro-label}'
  code-label-dark:
    backgroundColor: '{colors.code-canvas-dark}'
    textColor: '{colors.code-label-dark}'
    typography: '{typography.micro-label}'
  code-border-light:
    backgroundColor: '{colors.code-border-light}'
    height: 1px
  code-border-dark:
    backgroundColor: '{colors.code-border-dark}'
    height: 1px
---

# Musubi Design System

## Overview

Musubi is a static publishing framework for personal and technical writing in Chinese, English, or both. Its primary audience is a reader who has come to understand an essay, inspect code, or browse an archive; every page should make those jobs easier before it expresses the framework itself.

The visual direction follows Kami's paper-like restraint while adapting it to responsive web reading. Pure white or warm black fills the viewport, one centered reading axis gives the site the continuity of a single sheet of paper, and type, whitespace, and fine rules carry hierarchy. The page is editorial rather than application-like: it has no dashboard chrome, card grid, promotional hero, or decorative illustration by default.

The characteristic element is the tension between a quiet paper surface and one controlled Suō-red accent. The accent marks links, focus, current position, and structural emphasis; it must never become a large decorative field. Chinese JinKai and English Charter provide the site's personality, while JetBrains Mono and unmodified GitHub syntax themes make code utilitarian and familiar.

Musubi's built-in reader interface is English-only in the initial release. Author-owned titles, summaries, Pages, Posts, captions, site identity, and navigation remain in the language in which they are written. The document language setting continues to govern metadata and locale-sensitive date formatting; framework-owned English strings must be marked as English when the surrounding document uses another language.

## Colors

The light theme is a pure white sheet with warm-black type. The dark theme is a warm near-black sheet rather than a blue-gray or absolute black inversion. Both themes use four neutral text levels, two neutral divider levels, one shared brand role, and three semantic Callout roles.

- **Light canvas (`#FFFFFF`):** The page background and the main expression of the design.
- **Light surface (`#FAF9F5`):** A warm contained surface for inline code, table headers, and other elements that genuinely need a filled region.
- **Light text (`#141413`, `#3D3D3A`, `#504E49`, `#6B6A64`):** Use primary for headings and core reading text, secondary for interface text, supporting for summaries and ledes, and tertiary for metadata and captions.
- **Light dividers (`#E8E6DC`, `#F0EFE9`):** Use primary for explicit boundaries and thematic breaks; use secondary for repeated rows and quiet separators.
- **Dark canvas (`#141413`):** The page background in Dark mode.
- **Dark surface (`#30302E`):** The contained surface for inline code and neutral table headers in Dark mode.
- **Dark text (`#E8E6DC`, `#C9C7BE`, `#AAA8A0`, `#898780`):** Apply the same four roles as the light theme on the dark canvas. On the `#30302E` surface, replace tertiary `#898780` with `#9D9B93`; the first three levels remain unchanged.
- **Dark dividers (`#4A4944`, `#383733`):** Use the first for clear structure and the second for quiet repetition. Use the primary divider when a contained dark surface needs a clearly visible boundary.
- **Brand (`#A64156` light, `#E78394` dark):** Use for prose links, keyboard focus, current navigation, strong emphasis, heading permalinks, blockquote rules, list markers, checked task boxes, and other small structural or interactive accents. Keep its visible area to roughly five percent or less.
- **Semantic Callouts:** Note uses `#0969DA` light and `#4493F8` dark; Warning uses `#9A6700` light and `#D29922` dark; Error uses `#D1242F` light and `#F85149` dark. These values come directly from GitHub Primer roles and do not derive from the brand seed.

The light brand color is the source of truth. The current dark value is generated by Musubi's versioned dark-brand algorithm v2 for its fixed usage backgrounds rather than selected by eye. When the brand seed or a checked usage background changes, run `vp run brand:update` and review the regenerated pair; do not create component-specific color variants.

Fenced code is an intentional exception to the editorial palette. Light blocks use GitHub's `#FFFFFF` canvas, `#E1E4E8` border, `#24292E` foreground, and `#6A737D` utility label. Dark blocks use `#24292E`, `#1B1F23`, `#E1E4E8`, and `#959DA5`. Syntax tokens come from the complete Shiki `github-light` and `github-dark` themes and retain their original colors and font styles.

## Typography

Typography carries most of Musubi's identity. Chinese body and ordinary interface text use Tsanger JinKai 02 W04; Chinese headings and explicit emphasis use W05. English headings, prose, metadata, and interface text use Charter with conventional serif fallbacks. Code uses JetBrains Mono, with W04 available for Chinese code text. Do not introduce a default sans-serif interface family.

When Tsanger source files are available to a build, generate role-aware W04 and W05 subsets from the actual published corpus. Build-known Chinese body and ordinary interface characters belong to W04; headings and explicit emphasis belong to W05; Home list titles are a deliberate W04 exception. Preserve every mapped code point from `LXGW WenKai GB Medium v1.522` across content-addressed, pre-sharded `Musubi CJK Fallback` files for characters that first appear at runtime or are absent from a generated Tsanger subset. Do not synthesize missing weights or styles.

- **Body:** `17px / 28px`. English uses zero letter spacing. Apply `0.015em` letter spacing only to Chinese characters, Chinese punctuation, and full-width symbols, not to an entire mixed-language run.
- **Supporting prose:** `16px / 26px` for summaries, optional ledes, and secondary text that may still be a full paragraph.
- **Interface:** `14px / 20px` for navigation, table-of-contents links, Callout labels, Blog year headings, and other short structural text.
- **Metadata:** `13px / 20px` for dates, captions, footer copy, and passive facts.
- **Micro labels:** `12px / 16px` is the minimum for short utility text such as a code language label; never use this tier for prose or ordinary navigation.
- **Headings:** Use H1 `32px / 1.28`, H2 `27px / 36px`, H3 `22px / 32px`, H4 `19px / 28px`, and H5 `17px / 28px`. Use W05 for Chinese and Charter's heading treatment for English. Size, position, whitespace, and color work together; do not make headings oversized merely to establish hierarchy.
- **Home and Blog entry titles:** Use `20px / 30px`, W04 for Chinese, regular Charter for English, and normal weight. These are restrained navigation items, not miniature article H1s.
- **Strong:** Use W05 for Chinese and Charter's strong treatment for Latin, with the shared theme brand color. Do not add an underline or fill.
- **Emphasis:** Keep Latin `em` in Charter italic. Render Chinese `em` upright in W05 because a synthesized JinKai italic is not part of the system.
- **Deletion:** Use the supporting neutral color and a plain one-pixel line-through.

Titles should remain on one line when they naturally fit, but they must wrap at normal line-breaking opportunities when they exceed the available width. Never use `nowrap`, clipping, truncation, or type shrinking to preserve a single line.

## Layout

Musubi uses a fixed-maximum outer frame and one centered reading axis. The outer content edges are at most `1120px` apart; the implementation may use a `1160px` box when that box includes the required `20px` padding on each side. The reading column is at most `720px`. Both widths shrink fluidly, and ordinary content always retains at least `20px` between itself and each viewport edge. Reserve vertical-scrollbar space symmetrically so the outer frame, header controls, and reading axis retain the same physical horizontal coordinates when navigation moves between short and long routes. Browsers without native symmetric-gutter support use a permanent scrollbar plus equal left-side compensation. Do not solve route stability by allowing document-level horizontal overflow.

Three widths exist for non-prose content: the `720px` reading column, the `1120px` outer frame, and the available viewport. Keep ordinary figures, tables, code, Callouts, and diagrams at `720px`. Use `1120px` when one complex item or relationship needs to remain visible at once. Use viewport-edge, component-local horizontal scrolling only for continuous media that readers intentionally explore item by item. The document itself must never scroll horizontally. Until Musubi gains an explicit author-owned width declaration, every supported content block renders at `720px`; never infer a wider tier from pixel size, aspect ratio, file size, Notion layout, or component type.

- **Home:** Open with the authored prose of the optional `Type = Home` row when one is published, then show the five most recent Posts, newest first, in the `720px` column. Home renders no title and reserves no room for one: the opening begins at the page padding, on the same line as the first ink of every other route — Blog's `Blog`, an article's title. Set the opening as ordinary body content. Separate it from the index by `40px` with no rule; the index takes a `14px` interface-tier label, its entries drop the `border-bottom` Blog gives them and sit `20px` apart, and each summary uses the `13px` metadata tier so it separates from its `20px` title. Close with one underlined ellipsis at body size linking to `/blog`, carrying an accessible name because the mark itself states nothing. Do not add a hero, a visible Home H1, tags, categories, or reading time — the Home row's own Title is never rendered.
- **Blog:** Begin with the semantic H1 `Blog`, then show every published Post on one unpaginated page. Group entries by year, newest first, on the same `720px` axis. Use the same title and optional natural summary treatment as Home, but omit the repeated year from each inline date because the group heading already supplies it. Do not separate every entry with a border; use one secondary divider only between adjacent year groups.
- **Post:** Align H1, optional lede, publication date, and prose to `720px`. The date is currently the only header metadata, but the line may accept future approved fields. Place a full outer-frame divider below the header with `24px` from metadata to divider and another `24px` from divider to body, then finish the article with one restrained `Back to Blog` link.
- **Page:** A Page is a top-level non-Post route. Reuse the Post reading system and outer-frame header divider, but show no date, empty metadata row, or `Back to Blog` link.
- **Page openers:** Home starts with content. Blog, Post, and Page start with their semantic H1. Do not add recurring eyebrow labels, a decorative short rule, or a long divider to Home or Blog.
- **404 and empty Blog:** Keep them plain on the reading axis without cards or illustrations. A 404 states what happened and offers `Back to Home`; an empty Blog states that no Posts have been published and offers no action a public reader cannot perform.

Base spacing follows a `4px` grid. Paragraphs end with `16px`. Use `40px` before and `12px` after H2; `28px` before and `8px` after H3; `24px` before and `8px` after H4; and `20px` before and `8px` after H5. Lists use `8px` above and `16px` below, with no automatic extra gap between adjacent items. Blockquotes, Callouts, figures, tables, files, and link rows use approximately `20px` above and below. Fenced code uses `16px`; a thematic break uses `40px` above and `24px` below. A figure or gallery that leaves the reading axis uses `28px` to mark the transition.

## Elevation & Depth

Musubi is flat. Hierarchy comes from typography, whitespace, one-pixel rules, two-pixel semantic or brand rules, and small changes in warm-neutral surface tone. Articles, lists, code blocks, Callouts, navigation, and archive entries do not use drop shadows or hover elevation.

Do not place the page, article, or list entries inside floating cards. Use `#FAF9F5` or `#30302E` only when a component genuinely needs containment, such as inline code or a table header. A future floating menu or dialog may use one very soft shadow only when border and tone cannot separate it from the page.

## Shapes

The page, reading column, header, footer, navigation states, Callouts, tables, attachments, and archive rows are square and line-led. Do not add a rounded article container or use pills for ordinary metadata and tags.

Inline code uses a restrained `3px` radius and fenced code uses `6px`. Small controls may use up to `4px`, while menus or dialogs may use up to `8px` if introduced. The appearance control is one zero-radius segmented group of three square icon buttons. A circular or pill shape is reserved for an interaction whose behavior specifically requires it, not for decoration.

## Components

- **Global header:** Use a three-zone `60px` desktop header inside the outer frame: configured site identity on the left, one combined primary-and-social navigation module in the visual center, and only the appearance control on the right. Separate site links from social links with one quiet vertical rule. The default example identity is plain-text `Musubi`; do not invent an icon, logo, or decorative short rule.
- **Narrow header:** At `760px` and below, use an `88px` two-row header. Put site identity and appearance control at opposite ends of the first row and the combined navigation on the second. Keep navigation on one line; when it exceeds the available width, scroll only that row, show subtle edge fades, and bring the current page into view. Do not wrap it or hide it in a menu by default.
- **Sticky behavior:** Keep the header visible at the top of the page, slide it out when the reader scrolls down, and reveal it when the reader scrolls up. Revealing it on keyboard focus is mandatory.
- **Footer:** Match the header's height: `60px` desktop and `88px` narrow. Place `© {currentYear} {siteOwner}` at the left and `Built with Musubi` at the right, linking only `Musubi`. Keep both on one line even on mobile. Do not include RSS.
- **Navigation:** Neutral links become brand-colored on hover. The current page uses the theme brand color plus a `2px` underline that spans only its label. Keyboard focus remains a separate visible state.
- **Prose links:** Use brand-colored text and a persistent `1px` underline at `42%` brand opacity with a `3px` offset. Strengthen the underline to the full brand color on hover. External destinations open in a new browsing context with `noopener`; internal routes remain in the current context.
- **Heading permalinks:** Give each section heading a stable fragment and a brand-colored `#` with the same computed size and line height as its heading. Reveal it on heading hover or keyboard focus on hover-capable desktop devices; keep it visible where hover is unavailable. Keep the heading text on the `720px` reading axis at every width: never shift one heading away from the surrounding prose to make room for the permalink. Position the symbol in the outer gutter, leaving `16px` between its box and the title on wide layouts and `8px` on narrow layouts. Where overlay scrollbars leave no reserved viewport gutter, increase the complete reading-axis gutter just enough to keep the full-size symbol visible; keep its title, prose, and other headings together on that same axis. Below `760px` that gutter is `40px`: a `#` beside an H2 is about `20px` wide and the accepted gap takes `8px`, so a narrower gutter pins the symbol against the viewport edge. Home, Blog, and articles all take that value even though only articles and Home render a `#`, because the reading axis would otherwise shift horizontally as navigation moves between them. Give the permalink at least a `24px` pointer target.
- **Lists and blockquotes:** Use brand-colored list markers. Keep unchecked task boxes neutral and render checked task boxes with the current theme's shared brand accent. Blockquotes remain transparent with a `2px` brand left rule, `20px` inset, and supporting text color.
- **Inline code:** Use the standard neutral surface without a border, `3px` radius, JetBrains Mono, and approximately `0.88em` text. It should remain part of the sentence rather than resemble a badge or control. The current light treatment is intentionally quiet; its contrast may be revisited without changing this document until a replacement is accepted.
- **Fenced code:** Use complete Shiki `github-light` and `github-dark` token styling, the exact GitHub surfaces and borders defined above, `6px` radius, and `14px / 23px` code. Keep the optional language label and visible Copy action above and outside the scrolling region. Never wrap code; scroll long lines locally. Copy reports `Copied` or `Copy failed` visibly and to assistive technology.
- **Callouts:** Support Note, Warning, and Error. Keep the background transparent and use only a `2px` semantic left rule; show a neutral English role label above neutral body text and show no source icon, replacement icon, badge, or semantic fill. Color cannot be the only carrier of meaning.
- **Callout authoring:** A Callout is Note by default. Inspect only its first content line for one complete supported declaration: `{note}` or `{type=note}`, `{warning}` or `{type=warning}`, and `{error}` or `{type=error}`. Ignore leading whitespace, whitespace just inside braces, whitespace around `=`, and ASCII case. Remove a recognized declaration and retain ordinary text after it. Unsupported or malformed brace text such as `{info}` or `{warning` remains visible ordinary content and the Callout remains Note; do not fail, guess, or require an escape syntax.
- **Table of contents:** Present the directory as an editorial index rather than a Callout or ordinary nested list. Keep one vertical column at every viewport width and draw no background, border, or decorative rule; the visible neutral `Contents` label identifies the component without competing with a nearby article-header divider. Render the label at `14px / 22px` in heading type. Render links at `14px / 22px` with `2px` vertical padding: top-level entries use ink and heading weight, while descendants use regular supporting text. Leave `8px` only between adjacent top-level groups; keep descendants close to their parent and indent each nested level by `12px`, for a maximum `36px` offset. Do not underline links at rest; use the brand color and a `1px` underline only on hover or keyboard focus. Do not split the list into desktop columns.
- **Tables:** Use a light neutral header, the primary divider below a header row, and secondary horizontal separators between ordinary rows. A table wider than the reading column scrolls in its own container; it never widens or scrolls the page.
- **Figures and galleries:** Ordinary figures remain on the reading axis without a decorative frame. A wide figure's overall caption returns to the `720px` axis; each gallery item's caption stays attached to its image. Add a thin neutral border only when an image edge would otherwise disappear into the canvas.
- **Files and external references:** Render them as quiet list rows with separators, not application cards.
- **X post references:** Keep only the canonical X status URL in Notion Data and render it as an ordinary safe external link in the `720px` reading column. The initial implementation makes no X request during refresh, generation, or browser rendering and does not load provider HTML or widget scripts. A later browser-only enhancement may be considered separately, but it must preserve the readable link and cannot change the snapshot or publication contract.
- **Appearance modes:** Support Light, Dark, and System. First visits use System; explicit choices persist; a saved System choice continues to track operating-system changes in real time. System is a preference source, not a third palette.
- **Appearance control:** Use one restrained segmented group containing three adjacent icon buttons in the fixed order Light, Dark, System. Selecting a segment applies that mode directly. Fixed Light uses a sun, fixed Dark a crescent, and System uses a plain monitor without a resolved-theme badge. The page itself shows whether System currently resolves to Light or Dark; keep that result in the System button's accessible name and tooltip rather than adding another glyph. Mark the selected segment structurally, and do not add a curtain decoration, cyclic interaction, menu, or animated intermediate state.
- **Focus and selection:** Every keyboard-reachable control uses a visible `2px` theme-brand outline with `3px` offset. Text selection uses a quiet brand-tinted background. Never rely on hover or color alone to convey state.
- **Motion:** Keep ordinary color transitions around `120–160ms` and the sticky-header movement around `180ms`. Appearance choices change directly with only the ordinary short state transition. Use motion only to explain state or preserve reading space, not to animate content into view. Under `prefers-reduced-motion: reduce`, remove smooth scrolling and reduce transitions and animations to effectively immediate changes.

Musubi does not provide a print stylesheet. Do not hide interface chrome, replace the active theme, rewrite link presentation, or add page-breaking rules specifically for printing.

## Do's and Don'ts

- Do make long-form reading and code inspection the first priority of every page.
- Do preserve the centered `720px` axis and use the `1120px` frame only for shell structure or genuinely wide information.
- Do use type, whitespace, and fine rules before adding another container.
- Do keep the single brand accent coupled across links, focus, current state, strong emphasis, heading permalinks, blockquotes, and list markers.
- Do regenerate and review the dark brand color whenever its light seed or checked backgrounds change.
- Do preserve the four neutral text roles and verify them separately on every surface.
- Do let long titles and summaries wrap naturally instead of truncating or shrinking them.
- Do keep Home short, Blog complete, Posts dated, and Pages free of Post-only metadata.
- Do keep code syntax familiar, horizontally scrollable, and easy to copy in both themes.
- Do provide visible text labels for Callout meaning even though the left rule also uses a semantic color.
- Do test Chinese, English, mixed-language, code-heavy, image-heavy, short, and long content at desktop and narrow widths in Light, Dark, and System modes.
- Don't add a hero, promotional intro, recurring eyebrow, decorative brand mark, or default About page.
- Don't turn archives, files, links, Callouts, or article sections into a grid of interchangeable cards.
- Don't use gradients, glass effects, neon colors, cold blue-gray surfaces, heavy shadows, or large accent-colored areas.
- Don't introduce another accent hue for ordinary structure; semantic Note, Warning, and Error colors are the explicit exception.
- Don't synthesize Chinese bold or italic styles, and don't add a default sans-serif interface face.
- Don't infer wide content from source dimensions or Notion layout before an explicit author declaration exists.
- Don't wrap mobile navigation, hide it behind a menu by default, or allow any component to create document-level horizontal scrolling.
- Don't create print-specific behavior.