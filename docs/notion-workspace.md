# Notion Workspace Contract

Musubi reads one Content data source and one Config data source during generation. Both sources should live below one Notion root page shared with a dedicated internal integration that has only the `Read content` capability. Musubi never writes to Notion.

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
| `Type`             | Select       | `Post` or `Content`                                          |
| `Description`      | Text         | Optional                                                     |
| `Tags`             | Multi-select | Optional metadata                                            |
| `ShowInNavigation` | Checkbox     | Default true in the Content page template                    |
| `NavigationOrder`  | Number       | Optional                                                     |

`ShowInNavigation` and `NavigationOrder` may be absent in a compatible source; Musubi then treats Content pages as visible and unordered. Other missing required columns stop generation. Tags never create routes.

## Config data source

Create these properties with the exact names and Notion types:

| Property      | Notion type | Purpose                          |
| ------------- | ----------- | -------------------------------- |
| `Description` | Title       | Human explanation of the setting |
| `Key`         | Select      | One allowlisted key below        |
| `Value`       | Text        | Setting value                    |
| `Enable`      | Checkbox    | Whether the row participates     |

Enabled rows may use `Title`, `Description`, `Author`, `Link`, `Lang`, `Timezone`, `Since`, `PostsPerPage`, `GitHub`, and `X(Twitter)`. Each key may occur once. Unknown enabled keys, duplicate keys, and invalid values stop generation. An absent key uses the repository default for that field; an unreadable Config source never falls back to the complete local object.

## Generation

From a fresh fork:

```sh
vp install
vp run ready
```

The complete deployable site is `.output/public`. Generation reads the current Notion state once, copies required remote images and Notion file blocks into stable output, renders only Published rows, and fails instead of publishing an incomplete required page.

## Accepted page body dialect

Musubi accepts a bounded subset of Notion's page-as-Markdown output and normalizes it into project-owned nodes before Vue renders it. This table is the durable source-syntax mapping:

| Notion Markdown source                                                                             | Musubi node or result                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Paragraph text, emphasis, strong, strikethrough, inline code, safe links, and line breaks          | `paragraph` with allowlisted inline nodes              |
| Headings 1–4                                                                                       | `heading` with a generated stable fragment and TOC row |
| Ordered, unordered, nested, and GFM task lists                                                     | `list` and `listItem`                                  |
| Fenced or indented code                                                                            | `code`                                                 |
| Blockquote and thematic break                                                                      | `quote` and `divider`                                  |
| Markdown image with nonempty alternative text                                                      | `image`, then a stable generated asset                 |
| GFM table                                                                                          | `table`                                                |
| Allowlisted `<callout>`, `<file>`, `<table>`, `<colgroup>`, `<col>`, `<tr>`, and `<td>` extensions | `callout`, `file`, or `table`                          |
| Self-closing `<table_of_contents />`                                                               | `tableOfContents` generated from normalized headings   |
| A source-resolved X `<unknown>` embed                                                              | Non-interactive `linkCard`                             |

Required remote files use absolute HTTPS source URLs and are downloaded, deduplicated, content-named, and rewritten during generation. Raw HTML, executable MDX expressions, custom emoji outside code, unknown tags or attributes, unresolved or unsupported required blocks, unsafe URLs, invalid table shapes, and unexplained truncated Markdown stop generation with source-page and line or block context. The full trust and failure boundary is in [Target Architecture](../.agents/docs/architecture.md).