---
version: alpha
name: Musubi Paper and Ink
description: A screen-first blog design derived from Kami's white print one-pager, with warm paper neutrals, Luo-led Chinese typography, one restrained blue accent, and a purpose-built dark palette.
colors:
  primary: '#1B365D'
  primary-hover: '#2D5A8A'
  primary-dark: '#9FBDE2'
  primary-dark-hover: '#BDD0E8'
  light-canvas: '#FFFFFF'
  light-surface: '#FAF9F5'
  light-surface-strong: '#F5F4ED'
  light-ink: '#141413'
  light-text: '#3D3D3A'
  light-text-muted: '#504E49'
  light-meta: '#6B6A64'
  light-border: '#E8E6DC'
  light-border-soft: '#E5E3D8'
  light-accent-soft: '#E4ECF5'
  dark-canvas: '#141413'
  dark-surface: '#1F1F1C'
  dark-surface-strong: '#30302E'
  dark-ink: '#FAF9F5'
  dark-text: '#D8D4C8'
  dark-text-muted: '#B0AEA5'
  dark-meta: '#969188'
  dark-border: '#383732'
  dark-border-soft: '#2B2A26'
  dark-accent-soft: '#26364B'
typography:
  display:
    fontFamily: '"Luo", "Musubi CJK Fallback", Seravek, Candara, Optima, "Iowan Old Style", Charter, Georgia, "Avenir Next", "SF Pro Text", sans-serif'
    fontSize: 42px
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: '"Luo", "Musubi CJK Fallback", Seravek, Candara, Optima, "Iowan Old Style", Charter, Georgia, "Avenir Next", "SF Pro Text", sans-serif'
    fontSize: 34px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.005em
  headline-md:
    fontFamily: '"Luo", "Musubi CJK Fallback", Seravek, Candara, Optima, "Iowan Old Style", Charter, Georgia, "Avenir Next", "SF Pro Text", sans-serif'
    fontSize: 27px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0em
  headline-sm:
    fontFamily: '"Luo", "Musubi CJK Fallback", Seravek, Candara, Optima, "Iowan Old Style", Charter, Georgia, "Avenir Next", "SF Pro Text", sans-serif'
    fontSize: 21px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0em
  lede:
    fontFamily: '"Luo", "Musubi CJK Fallback", Seravek, Candara, Optima, "Iowan Old Style", Charter, Georgia, "Avenir Next", "SF Pro Text", sans-serif'
    fontSize: 20px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0.01em
  body:
    fontFamily: '"Luo", "Musubi CJK Fallback", Seravek, Candara, Optima, "Iowan Old Style", Charter, Georgia, "Avenir Next", "SF Pro Text", sans-serif'
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: 0.01em
  body-sm:
    fontFamily: '"Luo", "Musubi CJK Fallback", Seravek, Candara, Optima, "Iowan Old Style", Charter, Georgia, "Avenir Next", "SF Pro Text", sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0.01em
  label:
    fontFamily: '"Luo", "Musubi CJK Fallback", Seravek, Candara, Optima, "Iowan Old Style", Charter, Georgia, "Avenir Next", "SF Pro Text", sans-serif'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.08em
  meta:
    fontFamily: '"Luo", "Musubi CJK Fallback", Seravek, Candara, Optima, "Iowan Old Style", Charter, Georgia, "Avenir Next", "SF Pro Text", sans-serif'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.02em
  code:
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, "Luo", "Musubi CJK Fallback", monospace'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0em
rounded:
  none: 0px
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: 48px
  chapter: 72px
  mobile-gutter: 20px
  desktop-gutter: 32px
  article-max: 680px
  shell-max: 1040px
components:
  page-light:
    backgroundColor: '{colors.light-canvas}'
    textColor: '{colors.light-ink}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  page-dark:
    backgroundColor: '{colors.dark-canvas}'
    textColor: '{colors.dark-ink}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  article-light:
    backgroundColor: '{colors.light-canvas}'
    textColor: '{colors.light-text}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  article-dark:
    backgroundColor: '{colors.dark-canvas}'
    textColor: '{colors.dark-text}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  lede-light:
    backgroundColor: '{colors.light-canvas}'
    textColor: '{colors.light-text-muted}'
    typography: '{typography.lede}'
    rounded: '{rounded.none}'
  lede-dark:
    backgroundColor: '{colors.dark-canvas}'
    textColor: '{colors.dark-text-muted}'
    typography: '{typography.lede}'
    rounded: '{rounded.none}'
  meta-light:
    backgroundColor: '{colors.light-canvas}'
    textColor: '{colors.light-meta}'
    typography: '{typography.meta}'
    rounded: '{rounded.none}'
  meta-dark:
    backgroundColor: '{colors.dark-canvas}'
    textColor: '{colors.dark-meta}'
    typography: '{typography.meta}'
    rounded: '{rounded.none}'
  code-block-light:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.light-text}'
    typography: '{typography.code}'
    rounded: '{rounded.md}'
    padding: '{spacing.md}'
  code-block-dark:
    backgroundColor: '{colors.dark-surface}'
    textColor: '{colors.dark-text}'
    typography: '{typography.code}'
    rounded: '{rounded.md}'
    padding: '{spacing.md}'
  menu-light:
    backgroundColor: '{colors.light-surface-strong}'
    textColor: '{colors.light-ink}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.lg}'
    padding: '{spacing.sm}'
  menu-dark:
    backgroundColor: '{colors.dark-surface-strong}'
    textColor: '{colors.dark-ink}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.lg}'
    padding: '{spacing.sm}'
  link-light:
    backgroundColor: '{colors.light-canvas}'
    textColor: '{colors.primary}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  link-light-hover:
    backgroundColor: '{colors.light-canvas}'
    textColor: '{colors.primary-hover}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  link-dark:
    backgroundColor: '{colors.dark-canvas}'
    textColor: '{colors.primary-dark}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  link-dark-hover:
    backgroundColor: '{colors.dark-canvas}'
    textColor: '{colors.primary-dark-hover}'
    typography: '{typography.body}'
    rounded: '{rounded.none}'
  selection-light:
    backgroundColor: '{colors.light-accent-soft}'
    textColor: '{colors.primary}'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
    padding: '{spacing.xs}'
  selection-dark:
    backgroundColor: '{colors.dark-accent-soft}'
    textColor: '{colors.primary-dark}'
    typography: '{typography.body}'
    rounded: '{rounded.sm}'
    padding: '{spacing.xs}'
  divider-light:
    backgroundColor: '{colors.light-border}'
    height: 1px
  divider-light-soft:
    backgroundColor: '{colors.light-border-soft}'
    height: 1px
  divider-dark:
    backgroundColor: '{colors.dark-border}'
    height: 1px
  divider-dark-soft:
    backgroundColor: '{colors.dark-border-soft}'
    height: 1px
---

# Musubi Design Direction

## Overview

This is the selected visual direction implemented by Musubi. Earlier product code remains historical migration evidence and does not override this record.

Yunfei selected the Kami white print artifact as the reference for the overall blog style, the inspected warm dark palette alongside the light theme, and Luo as Musubi's Chinese typeface. Musubi pins and self-hosts a reviewed Luo input and automatically generates a matching `Musubi CJK Fallback` subset for every current-corpus code point assigned to Chinese typography that Luo lacks.

Musubi should feel like a carefully typeset personal publication rather than a generic application shell. The primary reference is Kami's [white print one-pager](https://kami.tw93.fun/assets/demos/demo-kami-print.html) at [`b3d856266d3e75278770f58e55d19d69583e35b0`](https://github.com/tw93/Kami/tree/b3d856266d3e75278770f58e55d19d69583e35b0): white paper, warm black text, warm gray supporting tones, one ink-blue accent, type-led hierarchy, fine rules, restrained whitespace, and almost no visual effects.

This is a translation of the reference into a responsive, screen-first blog, not a copy of its fixed A4 layout or font choice. The reference keeps two-column and four-column structures at a 390px viewport, so Musubi must redesign those structures for narrow screens. Its TsangerJinKai02 font files are also about 18MB per weight, and the pinned [Kami font notice](https://github.com/tw93/Kami/blob/b3d856266d3e75278770f58e55d19d69583e35b0/README.md#L201) states that commercial use needs separate authorization. Musubi uses Luo for Chinese instead.

The recurring visual signature is a short ink-blue rule followed by a small, letter-spaced label above important page titles. Major headers may pair a left-aligned title block with a quiet right-aligned metadata block on wide screens. This detail should identify the publication without turning every section heading into decoration.

## Colors

Light mode follows the white print artifact itself. White is the page, `#141413` is the principal ink, warm grays carry body text and metadata, and `#1B365D` is the only chromatic accent. `#FAF9F5` and `#F5F4ED` are small supporting surfaces, not alternate page backgrounds. Ink blue should normally occupy less than five percent of a page.

Dark mode reverses the paper-and-ink relationship instead of introducing a separate neon or blue-gray theme. `#141413` becomes the page, `#FAF9F5` becomes principal ink, and the supporting surfaces remain warm charcoal. The accent becomes `#9FBDE2` because Kami's lighter local blue, `#2D5A8A`, does not have enough contrast against the warm-black page for ordinary link text.

In the inspected representative article, the lowest text contrast was 5.43:1 in light mode and 5.88:1 in dark mode. The dark accent was 9.53:1 against the page, 8.54:1 against the ordinary surface, and 6.83:1 against the stronger surface. Border tokens are decorative separators rather than sufficient interactive boundaries; visible focus uses the accent instead.

- Use `primary` for links, focus, active navigation, list markers, the signature rule, and rare emphasis in light mode.
- Use `primary-dark` for the same roles in dark mode.
- Use the accent-soft tokens only for selection, a small tag, or a temporary interactive state; do not create large blue panels.
- Keep body text warm and neutral. Do not replace the supporting grays with cool slate or blue-gray.
- If Musubi defines print-specific presentation, it always uses the light white-paper palette regardless of the selected screen theme.
- Meet WCAG AA contrast for text and visible focus. Never use color as the only cue for state or meaning.

## Typography

Typography carries most of the hierarchy. Chinese characters, Chinese punctuation, and full-width symbols use Luo Regular. English and numbers use the humanist Seravek-first fallback stack recommended by Luo, while code, commands, and data whose alignment matters use the monospaced family.

The live specimen's implementation matches Luo source snapshot [`588c4f3`](https://github.com/tw93/Luo/tree/588c4f3dbe3a0e9b3b860ca62f61ca9b373909d1): one CJK-only `Luo-Regular.woff2` face at weight 400 under the SIL Open Font License 1.1. Repository main had already advanced to a different v0.4 preview at [`cf548a9`](https://github.com/tw93/Luo/tree/cf548a9ed1ae4034c43d647e8b32090d84630cb2) during inspection. Both builds are in progress and have incomplete GB2312 coverage. Musubi pins and self-hosts the reviewed `588c4f3` input, retains its license, declares the CJK unicode range, and never depends on a mutable CDN `main` asset.

`Musubi CJK Fallback` is a generated font, not an assumed platform font. A historical Yunfei corpus used 1,476 unique CJK characters; the inspected current Luo build covered 774 and missed 702, while covering 90.43 percent of CJK occurrences. Every deployment inventories the complete generated set assigned to Chinese typography, including CJK characters, Chinese punctuation, and full-width symbols, extracts only Luo-missing code points from the matching pinned LXGW WenKai Screen base, and emits one deterministic WOFF2. Because `LXGW WenKai` is an OFL Reserved Font Name, the generated font replaces every Reserved Font Name occurrence in its identity records, including localized family, full, unique, and PostScript names, with `Musubi CJK Fallback` identities rather than applying only a CSS alias. It retains copyright and OFL metadata and ships the license. If a required code point exists in neither pinned source, generation fails rather than silently switching to a platform font.

- Long-form body copy is 17px with a 1.75 line height on ordinary screens.
- The article lead is 20px with a 1.65 line height and should be used only once near the title.
- Major titles use the display or large-headline token; ordinary article sections use the medium and small headline tokens.
- On narrow screens, reduce display to approximately 32px and large headlines to approximately 28px while preserving line height and hierarchy.
- Balance multi-line display titles and prevent a lone CJK character on the final line. The implementation may use supported browser wrapping behavior or an explicit title layout, but it must be verified with representative long mixed-script titles rather than assumed from one viewport.
- Do not synthesize bold or italic Luo glyphs. Chinese hierarchy comes from size, spacing, position, and color. If a Latin-only utility label later needs another native weight, give it a separate Latin typography token instead of changing the mixed-script Luo tokens.
- Keep line length near 36 to 42 CJK characters or 60 to 75 Latin characters. Do not widen prose merely because the viewport allows it.

## Layout

The default article is one continuous column with a maximum width of 680px. A wider 1040px shell may hold site navigation, article metadata, indexes, figures, or intentionally wider editorial compositions, but prose returns to the article column.

- Center the shell, use 32px desktop gutters and 20px mobile gutters, and let the canvas extend to the viewport edge without a card around the article.
- Separate sections with 48px and major chapters with 72px. Use the smaller spacing scale inside a coherent section.
- Let wide article headers use the reference's asymmetric title and metadata arrangement. Move metadata below the title on narrow screens.
- Use thin horizontal rules to separate durable groups such as the site header, article metadata, and footer.
- Treat two-column notes, metrics, and timelines as optional editorial structures. Collapse them to one column or a readable wrapped grid before their text becomes narrow.
- Blog indexes should read like an editorial contents page: title and summary lead, date and metadata recede, and fine rules or whitespace separate entries. Do not wrap every post in a card.
- Images and diagrams may escape the article column up to the shell width when their content needs it. Captions return to the muted metadata style.
- Preserve a calm first viewport. Navigation and utilities should not compete with the article title.

Responsive behavior is based on readable content, not on preserving the reference's A4 geometry. At 390px, no body paragraph, list, timeline step, metric, code block, or metadata group may be forced into the fixed two-column or four-column arrangements used by the source artifact. Horizontal scrolling is permitted for code and genuinely tabular data only.

If print-specific presentation is included, it hides site navigation and interactive controls, restores the light palette, uses a white page, avoids splitting coherent figures or callouts where possible, and preserves readable link destinations when useful.

## Elevation & Depth

Hierarchy comes from typography, whitespace, thin rules, and small surface-tone changes. Articles, lists, code blocks, and callouts do not use drop shadows. A floating menu or dialog may use one very soft shadow when separation cannot be achieved by border and tone alone; ordinary hover states must not make content cards rise.

## Shapes

The page and article column have no rounded container. Inline surfaces use 4px to 8px radii: 4px for small tags and selections, 6px for code and controls, and 8px for menus or dialogs. Pills are reserved for controls whose behavior requires that shape; post tags and metadata should usually remain text.

## Components

- **Site header:** A quiet text-led row with a fine bottom rule. The site name may use the signature label and rule, while navigation remains visually secondary.
- **Article header:** A label, title, optional lead, and restrained metadata. On desktop, metadata may align to the title block's right edge; on mobile it follows the lead in normal flow.
- **Links:** Ink blue in light mode and the lighter dark accent in dark mode. Preserve underlines in prose or provide another persistent non-color cue; hover alone is not enough.
- **Code blocks:** A warm, nearly white surface in light mode and a slightly lifted warm-charcoal surface in dark mode, with a thin border, 6px radius, and horizontal scrolling when needed. Do not use a saturated editor theme that overwhelms the article.
- **Blockquotes and callouts:** Transparent background by default, one blue left rule, and indented warm-gray text. Reserve filled backgrounds for a state whose meaning requires stronger containment.
- **Lists:** Use the single accent for small markers. Keep list indentation and vertical rhythm generous enough for mixed Chinese and English prose.
- **Post index entries:** Use whitespace and a thin divider instead of a card. Title is primary, summary is ordinary body text, and date or taxonomy uses the meta token.
- **Images and figures:** Use no decorative frame by default. Add a thin warm border only when the image edge would disappear into the page.
- **Theme control:** Small, text or icon led, keyboard reachable, visibly focused, and subordinate to navigation. Its mechanics are an implementation decision, but both explicit themes must be visually accepted.
- **Focus:** Use a clearly visible two-pixel outline derived from the active theme accent with enough offset to remain visible beside borders and text.

## Do's and Don'ts

- Do preserve the white-page light mode as the primary expression of the design.
- Do use Luo for Chinese, a humanist Latin companion, whitespace, and fine rules as the main hierarchy system.
- Do keep one blue accent and a warm neutral scale in both themes.
- Do make article content and responsive readability more important than A4 fidelity.
- Do inspect representative Chinese, English, mixed-language, code-heavy, image-heavy, short, and long posts in both themes.
- Don't copy the reference's fixed two-column or four-column structures onto narrow screens.
- Don't substitute Kami's TsangerJinKai02 for Luo or silently inherit Tsanger's licensing and payload cost.
- Don't synthesize unavailable Luo weights or styles.
- Don't put the article inside a floating rounded card.
- Don't use a grid of interchangeable cards as the default blog index.
- Don't use large gradients, glass effects, heavy shadows, neon accents, or cold blue-gray surfaces.
- Don't let accent color cover large areas or use multiple competing accent hues.
- Don't preserve screen dark mode when printing.