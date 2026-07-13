# Musubi Target Architecture

## Status

This record is the selected architecture for the current implementation. The prior prototype is historical migration evidence only: a responsibility was retained when the selected goal required it, not because the prototype already contained it.

## System overview

```mermaid
flowchart TB
  subgraph notion["Notion — canonical editing source"]
    content["Content data source"]
    config["Config data source"]
  end

  env["Read-only integration\n3 build environment values"]

  subgraph build["Deployment build — private boundary"]
    adapter["Build-only source adapter\nread each source once"]
    normalize["Validate and normalize\ntyped pages + SiteConfig"]
    body["Notion Markdown\nallowlisted Musubi AST"]
    assets["Stable local assets"]
    fonts["Luo + generated\nmissing-glyph fallback"]
    manifest["Complete route and file manifest"]
    nuxt["Nuxt static generation\nVue renderers"]
  end

  output[".output/public"]
  browser["Browser — static files only\nno Notion, public content API, or Nitro server"]

  env --> adapter
  content --> adapter
  config --> adapter
  adapter --> normalize
  adapter --> body
  adapter --> assets
  normalize --> manifest
  normalize --> fonts
  normalize --> nuxt
  body --> nuxt
  assets --> nuxt
  fonts --> nuxt
  manifest --> nuxt
  nuxt --> output
  output --> browser
```

## Distribution and trust boundaries

- Musubi is one Nuxt application distributed as source. A user can fork it, connect a Notion workspace that follows the documented two-source contract, provide `NOTION_TOKEN`, `NOTION_CONTENT_DATA_SOURCE_ID`, and `NOTION_CONFIG_DATA_SOURCE_ID`, and deploy the default website without editing source or a local configuration file.
- The ordinary onboarding model is a dedicated Notion internal integration with only `Read content`, shared with the root containing both data sources. Public OAuth and broader personal workspace credentials are outside the product contract.
- Notion is the sole canonical editing source for public content and public site settings. Git Markdown, browser-side editing, multiple source adapters, and a public arbitrary-configuration interface are not product capabilities.
- Notion credentials and responses exist only inside the private deployment build. Application components consume project-owned types and never import Notion SDK or converter response types.
- Musubi is not a Nuxt layer, independently versioned framework package, plugin system, or stable extension API. Downstream forks own their source changes and upgrades.

## Notion input contracts

### Content

The Content data source uses the following project-owned schema:

| Property           | Notion type    | Contract                                                                   |
| ------------------ | -------------- | -------------------------------------------------------------------------- |
| `Title`            | `title`        | Required and nonempty for every Published row                              |
| `Slug`             | `rich_text`    | Required and valid under the route contract for every Published row        |
| `Date`             | `date`         | Required for every Published Post                                          |
| `Status`           | `select`       | Exactly `Draft` or `Published`                                             |
| `Type`             | `select`       | Exactly `Post` or `Content`                                                |
| `Description`      | `rich_text`    | Optional summary                                                           |
| `Tags`             | `multi_select` | Optional metadata; never creates routes                                    |
| `ShowInNavigation` | `checkbox`     | Optional column; a missing column defaults every Content row to visible    |
| `NavigationOrder`  | `number`       | Optional column and value; a missing column or empty value means unordered |

The documented default Content page template sets `ShowInNavigation` to true. Draft rows are never public. Invalid enum values, missing required Published fields, duplicate identities, and route conflicts fail generation.

### Site settings

The Config data source uses `Description` (`title`), `Key` (`select`), `Value` (`rich_text`), and `Enable` (`checkbox`). Only enabled rows participate. `SiteConfig` is an ordinary internal object, not a user-facing configuration system.

| Notion key     | `SiteConfig` field | Accepted value                           |
| -------------- | ------------------ | ---------------------------------------- |
| `Title`        | `title`            | Trimmed nonempty string                  |
| `Description`  | `description`      | Trimmed nonempty string                  |
| `Author`       | `author`           | Trimmed nonempty string                  |
| `Link`         | `link`             | Absolute `http:` or `https:` URL         |
| `Lang`         | `lang`             | Structurally valid BCP 47 language tag   |
| `Timezone`     | `timezone`         | Valid IANA time-zone identifier          |
| `Since`        | `since`            | Base-10 integer year from 1 through 9999 |
| `PostsPerPage` | `postsPerPage`     | Positive base-10 integer                 |
| `GitHub`       | `github`           | Absolute `http:` or `https:` URL         |
| `X(Twitter)`   | `x`                | Absolute `http:` or `https:` URL         |

A repository-owned `defaultSiteConfig: SiteConfig` supplies field-level fallbacks only when optional keys are absent. Duplicate keys, unknown enabled keys, invalid values, and failure to load the authoritative Config source fail generation; Musubi never silently publishes an entirely local fallback site after a Notion failure.

## Generation pipeline

1. A build-only adapter paginates both data sources, retrieves every Published page body once, applies bounded concurrency and rate-limit retry, and reports failures with source and page context.
2. Project-owned validators produce typed page metadata and one resolved `SiteConfig`. They reject invalid input before any public route is emitted.
3. Page-as-Markdown responses are parsed into an allowlisted Musubi syntax tree. Markdown is data, never executable template code: raw HTML, MDX expressions, unsafe URL schemes, unexplained truncation, unsupported required blocks, and syntax outside the accepted dialect fail generation. A response marked truncated is accepted only when every reported unknown block is individually retrieved, confirmed as a selected optional embed, and represented in the tree.
4. Vue renderers cover paragraphs, headings below the page title, ordered and unordered lists, links, images with alternative text and captions, code, quotes, callouts, dividers, tables, tasks, and a generated table of contents. A named optional embed is isolated from the article; the initial X embed becomes a non-interactive link card and degrades to an ordinary safe link if provider enrichment fails.
5. Notion-hosted images and files are downloaded, deduplicated, deterministically named, and rewritten to stable generated paths. A required asset failure fails generation; short-lived authenticated URLs never enter the published artifact.
6. The build inventories Chinese characters, Chinese punctuation, and full-width symbols in public content, settings, and application text. It uses the pinned Luo font first and generates one deterministic `Musubi CJK Fallback` subset from the matching pinned LXGW source for corpus glyphs Luo lacks. A required glyph missing from both inputs or an invalid generated font fails generation. [DESIGN.md](../../DESIGN.md) owns typography and visual use; [the technology stack](./technology-stack.md) owns the selected font tools.
7. The route builder creates and validates the complete public route and emitted-file manifest before Nuxt generation. Nuxt build-only server/API handlers may transfer source data into generated HTML or payloads, but no handler is part of the public artifact.
8. Nuxt statically renders the validated manifest through Vue. A required route or body that cannot be generated fails the build instead of producing a partial site.

## Slug and route contract

- A Published slug is explicit and is never derived from its title. Musubi trims surrounding whitespace, normalizes the value to Unicode NFC, allows Unicode, and requires exactly one nonempty URL path segment.
- A slug must not be `.` or `..` and must not contain a slash, backslash, control character, query delimiter, fragment delimiter, or percent sign. Percent-encoded input is rejected instead of decoded so encoded separators and multiply encoded equivalents cannot create an ambiguous route; authors use raw Unicode instead.
- Comparisons use the NFC-normalized route and are case-insensitive. Diagnostics name both source rows or the source row and generated artifact involved in a conflict.
- Top-level Content slugs cannot occupy the reserved `blog`, `_musubi`, `_nuxt`, `__musubi_not_found`, `__nuxt_error`, `200`, or `404` names. Post slugs cannot occupy the `page` pagination namespace. The manifest additionally rejects collisions with Nuxt asset namespaces, error documents, generated routes, generated payloads, and emitted file paths rather than assuming that these fixed names are exhaustive.

The canonical public routes are:

| Surface                        | Route                                   |
| ------------------------------ | --------------------------------------- |
| First chronological Post index | `/`                                     |
| Later Post index pages         | `/blog/page/:page`, beginning at page 2 |
| Published Post                 | `/blog/:slug`                           |
| Published Content page         | `/:slug`                                |

Musubi does not generate `/blog/page/1`, tag routes, Draft routes, or a public content API. Missing and unpublished content returns 404.

## Navigation and public behavior

- Visible Published Content rows form the site navigation. Rows with a numeric `NavigationOrder` sort first by that number; ties and unordered rows sort by title. `ShowInNavigation: false` hides a row from navigation without unpublishing its direct route.
- Social destinations come from `SiteConfig`, not Content rows. Tags remain optional Post metadata without navigation or route behavior.
- The site provides explicit light and warm dark themes, follows the system preference by default, and offers a reader-controlled choice. Exact tokens, layout, typography, responsive behavior, and the Kami-derived direction live in [DESIGN.md](../../DESIGN.md).
- Locale-sensitive presentation resolves from `SiteConfig`; the repository defaults are `en-SG` and `Asia/Singapore`.
- The browser receives one static representation of each body and no unnecessary application runtime. Output size and transferred resources are measured from the generated artifact rather than governed by invented targets.

## Publication and failure behavior

- Each deployment build fetches the latest Notion state visible to that build and emits provider-neutral `.output/public`. Serving that directory alone is the complete production contract; `.output/server`, Notion access, and a running Nitro process are unnecessary.
- Failure of either authoritative source, invalid required content or settings, an unstabilized required asset, an invalid route manifest, a missing required glyph, or an incomplete prerender stops publication.
- Failure of an optional third-party embed remains local to that embed and cannot remove the surrounding article.
- Automatically starting a build after a Notion change, selecting a deployment provider, connecting the production `hyf.me` source, publishing a duplicable Notion template, and release operations are outside the current repository-local implementation.

## Architectural decisions

- Source distribution stays a single application because Yunfei wants direct ownership and a no-source-edit default fork path, not a separately maintained downstream compatibility surface. Reconsider only if a concrete Yunfei requirement needs independent versioning.
- The official Notion Markdown response is the external body boundary, while Musubi's allowlisted syntax tree is the rendering boundary. Reconsider a different external representation only when required content is repeatedly lossy or unrepresentable.
- Static generation is the only publication mode because public pages do not need runtime source access. Reconsider only for a concrete feature that cannot be delivered from static output.
- Settings use an allowlisted typed object with field-level defaults because public configuration belongs in Notion without becoming an arbitrary framework capability. Add keys only for concrete site behavior.
- Generated matching font fallback is corpus-scoped because platform fallback visibly mixes styles while shipping the entire matching font is needlessly large. Reconsider only if corpus-driven generation becomes unreliable or the pinned Luo source gains the required coverage.