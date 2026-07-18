# Notion Workspace Contract

Musubi reads one Content data source and one Config data source when `vp run notion:setup` refreshes the local Notion Data snapshot. Both sources should live below one Notion root page shared with a dedicated internal integration that has only the `Read content` capability. Musubi never writes to Notion.

## Environment

Copy `.env.example` to `.env.local` and fill exactly these values:

| Variable                        | Value                                                     |
| ------------------------------- | --------------------------------------------------------- |
| `NOTION_TOKEN`                  | Secret from the dedicated read-only Notion integration    |
| `NOTION_CONTENT_DATA_SOURCE_ID` | ID of the Content data source, not its parent database ID |
| `NOTION_CONFIG_DATA_SOURCE_ID`  | ID of the Config data source, not its parent database ID  |

The values are build secrets. They must not use a public prefix, appear in client code, or be copied into generated output.

## Content data source

Create these properties with the exact names and Notion types:

| Property           | Notion type  | Allowed values or default                                    |
| ------------------ | ------------ | ------------------------------------------------------------ |
| `Title`            | Title        | Required for Published rows                                  |
| `Slug`             | Text         | Explicit one-segment route slug; required for Published rows |
| `Date`             | Date         | Required for Published Posts                                 |
| `Status`           | Select       | `Draft` or `Published`                                       |
| `Type`             | Select       | `Post` or `Page`                                             |
| `Description`      | Text         | Optional                                                     |
| `Tags`             | Multi-select | Optional metadata                                            |
| `ShowInNavigation` | Checkbox     | Disabled by default; enable it to add the Page to navigation |
| `NavigationOrder`  | Number       | Optional                                                     |

Legacy `Type = Content` rows remain accepted and are normalized to Page while an existing source is migrated. New sources use only `Post` and `Page`. `ShowInNavigation` and `NavigationOrder` may be absent in a compatible source; Musubi then keeps Pages out of navigation and treats them as unordered. The direct Page route remains public. Other missing required columns stop generation. Tags never create routes.

## Config data source

Create these properties with the exact names and Notion types:

| Property      | Notion type | Purpose                          |
| ------------- | ----------- | -------------------------------- |
| `Description` | Title       | Human explanation of the setting |
| `Key`         | Select      | One allowlisted key below        |
| `Value`       | Text        | Setting value                    |
| `Enable`      | Checkbox    | Whether the row participates     |

Enabled rows may use `Title`, `Description`, `Author`, `Link`, `Lang`, `Timezone`, `Since`, `PostsPerPage`, `GitHub`, and `X(Twitter)`. Each key may occur once. Unknown enabled keys, duplicate keys, and invalid values stop generation. An absent key uses the repository default for that field; an unreadable Config source never falls back to the complete local object.

## Snapshot and generation

From a fresh fork:

```sh
vp install
vp run notion:setup
vp run ready
```

`vp run notion:setup` reads the current Notion state and atomically replaces the tracked `.musubi/notion-data-snapshot/` directory. Config schemas and rows live in `config.json`; every Published page lives in its own `pages/<notion-page-id>.json` file with the raw page row, Notion Markdown response, and any unknown blocks needed to interpret that Markdown. Draft rows are excluded. If a page's Notion `last_edited_time` is unchanged, setup reuses its prior page file instead of fetching its body again.

`vp run dev`, `vp run check:build`, and `vp run ready` read only this local snapshot. `vp run build` runs `vp run notion:setup` first and then performs the checked build. The complete deployable site is `.output/public`; it contains neither the snapshot nor Notion credentials.

## Accepted page body dialect

Musubi accepts a bounded subset of Notion's page-as-Markdown output and normalizes it into project-owned nodes before Vue renders it. This table is the durable source-syntax mapping:

| Notion Markdown source                                                                             | Musubi node or result                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Paragraph text, emphasis, strong, strikethrough, inline code, safe links, and line breaks          | `paragraph` with allowlisted inline nodes              |
| Headings 1–4                                                                                       | `heading` with a generated stable fragment and TOC row |
| Ordered, unordered, nested, and GFM task lists                                                     | `list` and `listItem`                                  |
| Fenced or indented code                                                                            | `code`                                                 |
| Blockquote and thematic break                                                                      | `quote` and `divider`                                  |
| Markdown image with nonempty alternative text                                                      | `image` retaining its remote HTTPS URL                 |
| GFM table                                                                                          | `table`                                                |
| Allowlisted `<callout>`, `<file>`, `<table>`, `<colgroup>`, `<col>`, `<tr>`, and `<td>` extensions | `callout`, `file`, or `table`                          |
| Self-closing `<table_of_contents />`                                                               | `tableOfContents` generated from normalized headings   |
| A source-resolved X `<unknown>` embed                                                              | `xEmbed` retaining only its source URL for a safe link |

Remote images and file blocks must use absolute HTTPS source URLs. Musubi initially keeps those URLs unchanged rather than downloading or rewriting their media. An unchanged page reuses its stored Markdown and URLs, so expiry of a Notion-hosted media URL is an accepted initial limitation rather than something the refresh command promises to repair. X handling is deliberately smaller: the snapshot records the Notion-provided X URL, and rendering produces a safe ordinary link without an oEmbed request or third-party widget script. Raw HTML, executable MDX expressions, custom emoji outside code, unknown tags or attributes, unresolved or unsupported required blocks, unsafe URLs, invalid table shapes, and unexplained truncated Markdown stop generation with source-page and line or block context. The full trust and failure boundary is in [Target Architecture](../.agents/docs/architecture.md).