<script setup lang="ts">
import type { MusubiBlock, MusubiTableOfContentsEntry } from '../../lib/content/types.ts'
import InlineRenderer from './InlineRenderer.vue'
import TocList from './TocList.vue'

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
</script>

<template>
  <p v-if="block.type === 'paragraph'">
    <InlineRenderer :nodes="block.children" />
  </p>

  <div v-else-if="block.type === 'heading'" class="prose-heading">
    <component :is="headingTag()" :id="block.id">
      <InlineRenderer :nodes="block.children" />
    </component>
    <a class="heading-anchor" :href="`#${block.id}`" aria-label="Link to this section">#</a>
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

  <pre
    v-else-if="block.type === 'code'"
  ><span v-if="block.language" class="code-language">{{ block.language }}</span><code>{{ block.value }}</code></pre>

  <blockquote v-else-if="block.type === 'quote'">
    <BlockRenderer
      v-for="(child, childIndex) in block.children"
      :key="childIndex"
      :block="child"
      :table-of-contents="tableOfContents"
    />
  </blockquote>

  <aside v-else-if="block.type === 'callout'" class="content-callout">
    <span v-if="block.icon" class="content-callout-icon" aria-hidden="true">{{ block.icon }}</span>
    <div>
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
    <figcaption v-if="block.caption">{{ block.caption }}</figcaption>
  </figure>

  <a v-else-if="block.type === 'file'" class="content-file" :href="block.src" download>
    <span aria-hidden="true">↓</span>
    <InlineRenderer :nodes="block.children" />
  </a>

  <div v-else-if="block.type === 'table'" class="content-table-wrap">
    <table>
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
    aria-label="Table of contents"
  >
    <p class="content-toc-title">Table of contents</p>
    <TocList :entries="tableOfContents" />
  </nav>

  <aside v-else-if="block.type === 'linkCard'" class="x-link-card">
    <span class="x-link-card-mark" aria-hidden="true">X</span>
    <div>
      <p class="x-link-card-label">Referenced X post</p>
      <a :href="block.url" target="_blank" rel="noreferrer">Read the post on X</a>
    </div>
  </aside>
</template>