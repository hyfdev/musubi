export interface SourcePoint {
  readonly line: number
  readonly column: number
  readonly offset?: number
}

export interface SourcePosition {
  readonly start: SourcePoint
  readonly end: SourcePoint
}

export type NotionColor =
  | 'default'
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'gray_bg'
  | 'brown_bg'
  | 'orange_bg'
  | 'yellow_bg'
  | 'green_bg'
  | 'blue_bg'
  | 'purple_bg'
  | 'pink_bg'
  | 'red_bg'

export interface MusubiNode {
  readonly position?: SourcePosition
}

export interface MusubiDocument extends MusubiNode {
  readonly type: 'document'
  readonly pageLabel: string
  readonly children: readonly MusubiBlock[]
  readonly tableOfContents: readonly MusubiTableOfContentsEntry[]
}

export type MusubiBlock =
  | MusubiParagraph
  | MusubiHeading
  | MusubiList
  | MusubiCodeBlock
  | MusubiQuote
  | MusubiCallout
  | MusubiDivider
  | MusubiImage
  | MusubiFile
  | MusubiTable
  | MusubiTableOfContents
  | MusubiLinkCard

export interface MusubiParagraph extends MusubiNode {
  readonly type: 'paragraph'
  readonly children: readonly MusubiInline[]
}

export interface MusubiHeading extends MusubiNode {
  readonly type: 'heading'
  readonly depth: 1 | 2 | 3 | 4
  readonly id: string
  readonly children: readonly MusubiInline[]
}

export interface MusubiList extends MusubiNode {
  readonly type: 'list'
  readonly ordered: boolean
  readonly start: number | null
  readonly children: readonly MusubiListItem[]
}

export interface MusubiListItem extends MusubiNode {
  readonly type: 'listItem'
  readonly checked: boolean | null
  readonly children: readonly MusubiBlock[]
}

export interface MusubiCodeBlock extends MusubiNode {
  readonly type: 'code'
  readonly language: string | null
  readonly value: string
}

export interface MusubiQuote extends MusubiNode {
  readonly type: 'quote'
  readonly children: readonly MusubiBlock[]
}

export interface MusubiCallout extends MusubiNode {
  readonly type: 'callout'
  readonly icon: string | null
  readonly color: NotionColor | null
  readonly children: readonly MusubiBlock[]
}

export interface MusubiDivider extends MusubiNode {
  readonly type: 'divider'
}

export interface MusubiImage extends MusubiNode {
  readonly type: 'image'
  readonly src: string
  readonly alt: string
  readonly caption: string | null
  readonly title: string | null
}

export interface MusubiFile extends MusubiNode {
  readonly type: 'file'
  readonly src: string
  readonly children: readonly MusubiInline[]
}

export type MusubiTableAlignment = 'left' | 'center' | 'right' | null

export interface MusubiTable extends MusubiNode {
  readonly type: 'table'
  readonly fitPageWidth: boolean
  readonly headerRow: boolean
  readonly headerColumn: boolean
  readonly align: readonly MusubiTableAlignment[]
  readonly children: readonly MusubiTableRow[]
}

export interface MusubiTableRow extends MusubiNode {
  readonly type: 'tableRow'
  readonly color: NotionColor | null
  readonly children: readonly MusubiTableCell[]
}

export interface MusubiTableCell extends MusubiNode {
  readonly type: 'tableCell'
  readonly color: NotionColor | null
  readonly children: readonly MusubiInline[]
}

export interface MusubiTableOfContents extends MusubiNode {
  readonly type: 'tableOfContents'
  readonly color: NotionColor | null
}

export interface MusubiLinkCard extends MusubiNode {
  readonly type: 'linkCard'
  readonly provider: 'x'
  readonly url: string
  readonly sourceUrl: string
  readonly sourceBlockId: string | null
}

export interface MusubiTableOfContentsEntry {
  readonly id: string
  readonly label: string
  readonly depth: 1 | 2 | 3 | 4
  readonly children: readonly MusubiTableOfContentsEntry[]
}

export type MusubiInline =
  | MusubiText
  | MusubiStrong
  | MusubiEmphasis
  | MusubiDelete
  | MusubiInlineCode
  | MusubiBreak
  | MusubiLink

export interface MusubiText extends MusubiNode {
  readonly type: 'text'
  readonly value: string
}

export interface MusubiStrong extends MusubiNode {
  readonly type: 'strong'
  readonly children: readonly MusubiInline[]
}

export interface MusubiEmphasis extends MusubiNode {
  readonly type: 'emphasis'
  readonly children: readonly MusubiInline[]
}

export interface MusubiDelete extends MusubiNode {
  readonly type: 'delete'
  readonly children: readonly MusubiInline[]
}

export interface MusubiInlineCode extends MusubiNode {
  readonly type: 'inlineCode'
  readonly value: string
}

export interface MusubiBreak extends MusubiNode {
  readonly type: 'break'
}

export interface MusubiLink extends MusubiNode {
  readonly type: 'link'
  readonly url: string
  readonly title: string | null
  readonly children: readonly MusubiInline[]
}

export interface MusubiContentDiagnostic {
  readonly code: MusubiContentErrorCode
  readonly pageLabel: string
  readonly message: string
  readonly position?: SourcePosition
}

export type MusubiContentErrorCode =
  | 'INVALID_DOCUMENT'
  | 'MARKDOWN_PARSE_ERROR'
  | 'UNSUPPORTED_SYNTAX'
  | 'INVALID_EXTENSION'
  | 'UNSAFE_URL'
  | 'INVALID_HEADING'
  | 'INVALID_IMAGE'
  | 'INVALID_FILE'
  | 'UNKNOWN_REQUIRED_BLOCK'
  | 'UNRESOLVED_EMBED'