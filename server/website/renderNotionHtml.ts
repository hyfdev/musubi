import type { ExtendedRecordMap } from 'notion-types'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { NotionRenderer } from 'react-notion-x'
import { Tweet as ReactTweet } from 'react-tweet'

// prismjs language add-ons and react-notion-x's Code component reference bare `Prism` global.
// `strictExecutionOrder` (in vite.config.ts) ensures prismjs core evaluates first
// and sets globalThis.Prism before language add-ons and Code are evaluated.
import 'prismjs'
import 'prismjs/components/prism-rust.js'
import 'prismjs/components/prism-markdown.js'
import { Code } from 'react-notion-x/build/third-party/code'

/**
 * Pre-renders Notion content to HTML string on the server.
 * This is called in .server.ts loaders so the client receives ready-to-hydrate HTML.
 *
 * Syntax highlighting is done server-side via prismjs so code blocks
 * are highlighted on first paint. The client-side NotionPage.vue hydrates
 * with the same Code component for interactivity.
 */
export function renderNotionHtml(recordMap: ExtendedRecordMap, darkMode: boolean = false): string {
  const element = React.createElement(NotionRenderer, {
    recordMap,
    fullPage: false,
    darkMode,
    components: {
      Collection: () => null,
      Tweet({ id }: { id: string }) {
        return React.createElement(ReactTweet, { id })
      },
      Code,
    },
  })

  return renderToString(element)
}
