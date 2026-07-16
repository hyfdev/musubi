<script setup lang="ts">
import type {
  MusubiBlock,
  MusubiCalloutRole,
  MusubiCodeToken,
  MusubiTableOfContentsEntry,
} from '../../lib/content/types.ts'
import TypographyText from '../TypographyText.vue'
import InlineRenderer from './InlineRenderer.vue'
import TocList from './TocList.vue'
import XEmbed from './XEmbed.vue'

const props = defineProps<{
  block: MusubiBlock
  tableOfContents: readonly MusubiTableOfContentsEntry[]
}>()

function headingTag(): string {
  return `h${Math.min(props.block.type === 'heading' ? props.block.depth + 1 : 2, 6)}`
}

function tableCellTag(rowIndex: number, cellIndex: number): 'th' | 'td' {
  if (props.block.type !== 'table') {
    return 'td'
  }
  return (props.block.headerRow && rowIndex === 0) || (props.block.headerColumn && cellIndex === 0)
    ? 'th'
    : 'td'
}

function calloutLabel(role: MusubiCalloutRole): string {
  return role[0]!.toUpperCase() + role.slice(1)
}

function tableOfContentsLabelId(): string {
  const start = props.block.position?.start
  return `table-of-contents-${start?.line ?? 0}-${start?.column ?? 0}`
}

function codeTokenStyle(token: MusubiCodeToken): Record<string, string> {
  const style: Record<string, string> = {
    '--code-token-light': token.light,
    '--code-token-dark': token.dark,
  }
  addCodeFontStyle(style, 'light', token.lightStyle)
  addCodeFontStyle(style, 'dark', token.darkStyle)
  return style
}

function addCodeFontStyle(
  style: Record<string, string>,
  theme: 'light' | 'dark',
  fontStyle: number,
): void {
  if (fontStyle & 1) {
    style[`--code-token-${theme}-font-style`] = 'italic'
  }
  if (fontStyle & 2) {
    style[`--code-token-${theme}-font-weight`] = '700'
  }
  const decorations = [fontStyle & 4 ? 'underline' : '', fontStyle & 8 ? 'line-through' : '']
    .filter(Boolean)
    .join(' ')
  if (decorations) {
    style[`--code-token-${theme}-decoration`] = decorations
  }
}
</script>

<template>
  <p v-if="block.type === 'paragraph'">
    <InlineRenderer :nodes="block.children" />
  </p>

  <div
    v-else-if="block.type === 'heading'"
    class="prose-heading"
    :class="`prose-heading-${headingTag()}`"
  >
    <component :is="headingTag()" :id="block.id">
      <InlineRenderer :nodes="block.children" />
    </component>
    <a class="heading-anchor" :href="`#${block.id}`" aria-label="Link to this section" lang="en"
      >#</a
    >
  </div>

  <component
    :is="block.ordered ? 'ol' : 'ul'"
    v-else-if="block.type === 'list'"
    :start="block.ordered && block.start !== null ? block.start : undefined"
    :class="{ 'task-list': block.children.some((item) => item.checked !== null) }"
  >
    <li
      v-for="(item, itemIndex) in block.children"
      :key="itemIndex"
      :class="{ 'task-item': item.checked !== null }"
    >
      <input
        v-if="item.checked !== null"
        type="checkbox"
        :checked="item.checked"
        disabled
        aria-label="Task status"
      />
      <div class="list-item-body">
        <BlockRenderer
          v-for="(child, childIndex) in item.children"
          :key="childIndex"
          :block="child"
          :table-of-contents="tableOfContents"
        />
      </div>
    </li>
  </component>

  <div
    v-else-if="block.type === 'code'"
    class="code-block"
    :class="{ 'has-language': block.language }"
  >
    <div class="code-toolbar" lang="en">
      <span v-if="block.language" class="code-language">{{ block.language }}</span>
      <button type="button" class="code-copy">
        <span class="code-copy-label" aria-live="polite">Copy</span>
      </button>
    </div>
    <pre
      class="code-scroll"
      tabindex="0"
      :aria-label="block.language ? `${block.language} code block` : 'Code block'"
    ><code v-if="block.highlight"><span
      v-for="(token, tokenIndex) in block.highlight.tokens"
      :key="tokenIndex"
      class="code-token"
      :style="codeTokenStyle(token)"
    >{{ token.content }}</span></code><code v-else>{{ block.value }}</code></pre>
  </div>

  <blockquote v-else-if="block.type === 'quote'">
    <BlockRenderer
      v-for="(child, childIndex) in block.children"
      :key="childIndex"
      :block="child"
      :table-of-contents="tableOfContents"
    />
  </blockquote>

  <aside
    v-else-if="block.type === 'callout'"
    class="content-callout"
    :class="`content-callout-${block.role}`"
  >
    <div>
      <p class="content-callout-label" lang="en">{{ calloutLabel(block.role) }}</p>
      <BlockRenderer
        v-for="(child, childIndex) in block.children"
        :key="childIndex"
        :block="child"
        :table-of-contents="tableOfContents"
      />
    </div>
  </aside>

  <hr v-else-if="block.type === 'divider'" />

  <figure v-else-if="block.type === 'image'">
    <img :src="block.src" :alt="block.alt" loading="lazy" decoding="async" />
    <figcaption v-if="block.caption"><TypographyText :value="block.caption" /></figcaption>
  </figure>

  <a v-else-if="block.type === 'file'" class="content-file" :href="block.src" download>
    <span aria-hidden="true">↓</span>
    <InlineRenderer :nodes="block.children" />
  </a>

  <div v-else-if="block.type === 'table'" class="content-table-wrap">
    <table :class="{ 'has-header-row': block.headerRow }">
      <tbody>
        <tr v-for="(row, rowIndex) in block.children" :key="rowIndex">
          <component
            :is="tableCellTag(rowIndex, cellIndex)"
            v-for="(cell, cellIndex) in row.children"
            :key="cellIndex"
            :scope="
              tableCellTag(rowIndex, cellIndex) === 'th'
                ? rowIndex === 0
                  ? 'col'
                  : 'row'
                : undefined
            "
          >
            <InlineRenderer :nodes="cell.children" />
          </component>
        </tr>
      </tbody>
    </table>
  </div>

  <nav
    v-else-if="block.type === 'tableOfContents'"
    class="content-toc"
    :aria-labelledby="tableOfContentsLabelId()"
  >
    <p :id="tableOfContentsLabelId()" class="content-toc-title" lang="en">Contents</p>
    <TocList :entries="tableOfContents" />
  </nav>

  <XEmbed v-else-if="block.type === 'xEmbed'" :block="block" />
</template>