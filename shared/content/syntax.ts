import type { SourcePosition } from './types.ts'

export interface MarkdownSyntaxNode {
  readonly type: string
  readonly position?: SourcePosition
  readonly children?: readonly MarkdownSyntaxNode[]
  readonly value?: string
  readonly depth?: number
  readonly ordered?: boolean
  readonly start?: number | null
  readonly checked?: boolean | null
  readonly url?: string
  readonly title?: string | null
  readonly alt?: string | null
  readonly lang?: string | null
  readonly meta?: string | null
  readonly align?: readonly (string | null)[]
  readonly name?: string | null
  readonly attributes?: readonly MarkdownSyntaxAttribute[]
}

export interface MarkdownSyntaxAttribute {
  readonly type: string
  readonly name?: string
  readonly value?: string | null | object
}