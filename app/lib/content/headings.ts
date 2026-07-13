import { contentError } from './errors.ts'
import type { MusubiInline, MusubiTableOfContentsEntry, SourcePosition } from './types.ts'

export interface RegisteredHeading {
  readonly id: string
  readonly label: string
}

interface MutableTableOfContentsEntry {
  id: string
  label: string
  depth: 1 | 2 | 3 | 4
  children: MutableTableOfContentsEntry[]
}

export class HeadingRegistry {
  readonly #pageLabel: string
  readonly #counts = new Map<string, number>()
  readonly #headings: MutableTableOfContentsEntry[] = []
  readonly #usedIds = new Set<string>()

  constructor(pageLabel: string) {
    this.#pageLabel = pageLabel
  }

  register(
    depth: 1 | 2 | 3 | 4,
    children: readonly MusubiInline[],
    position?: SourcePosition,
  ): RegisteredHeading {
    const label = extractInlineText(children).trim()
    if (!label) {
      contentError({
        code: 'INVALID_HEADING',
        pageLabel: this.#pageLabel,
        position,
        message: 'A heading must contain readable text',
      })
    }

    const base = createHeadingIdBase(label)
    let count = (this.#counts.get(base) ?? 0) + 1
    let id = count === 1 ? base : `${base}-${count}`
    while (this.#usedIds.has(id)) {
      count += 1
      id = `${base}-${count}`
    }
    this.#counts.set(base, count)
    this.#usedIds.add(id)
    this.#headings.push({ id, label, depth, children: [] })
    return { id, label }
  }

  toTableOfContents(): readonly MusubiTableOfContentsEntry[] {
    const roots: MutableTableOfContentsEntry[] = []
    const stack: MutableTableOfContentsEntry[] = []

    for (const heading of this.#headings) {
      const entry: MutableTableOfContentsEntry = {
        ...heading,
        children: [],
      }

      while (stack.length > 0 && stack[stack.length - 1]!.depth >= entry.depth) {
        stack.pop()
      }

      const parent = stack[stack.length - 1]
      if (parent) parent.children.push(entry)
      else roots.push(entry)
      stack.push(entry)
    }

    return roots
  }
}

export function extractInlineText(children: readonly MusubiInline[]): string {
  return children
    .map((child) => {
      switch (child.type) {
        case 'text':
        case 'inlineCode':
          return child.value
        case 'break':
          return ' '
        case 'strong':
        case 'emphasis':
        case 'delete':
        case 'link':
          return extractInlineText(child.children)
      }
    })
    .join('')
}

export function createHeadingIdBase(value: string): string {
  const normalized = value
    .normalize('NFC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{Letter}\p{Number}_-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')

  return normalized || 'section'
}