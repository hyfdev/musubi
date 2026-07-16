import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import {
  parseMusubiMarkdown,
  type MusubiXEmbed,
  type MusubiXEmbedData,
} from '../../app/lib/content/index.ts'
import { enrichXEmbeds, fetchXEmbedData, parseXEmbedOEmbed } from './x-embeds.ts'

const POST_ID = '1509850662795989005'
const POST_URL = `https://x.com/mattpocockuk/status/${POST_ID}`

const enrichedData: MusubiXEmbedData = {
  content: [
    { type: 'text', value: 'A useful post' },
    { type: 'break' },
    {
      type: 'link',
      url: 'https://example.com/',
      title: null,
      children: [{ type: 'text', value: 'Example' }],
    },
  ],
  lang: 'en',
  dir: 'ltr',
  authorName: 'Matt Pocock',
  authorHandle: 'mattpocockuk',
  authorUrl: 'https://x.com/mattpocockuk',
  publishedLabel: 'April 1, 2022',
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('X oEmbed parsing', () => {
  it('converts the official blockquote into a bounded static fallback', () => {
    const parsed = parseXEmbedOEmbed(
      {
        url: POST_URL,
        author_name: 'Matt Pocock',
        author_url: 'https://twitter.com/mattpocockuk',
        html: `<blockquote class="twitter-tweet" data-dnt="true"><p lang="en" dir="ltr">A useful post<br><br>See <a href="https://t.co/example">example</a></p>&mdash; Matt Pocock (@mattpocockuk) <a href="${POST_URL}?ref_src=twsrc%5Etfw">April 1, 2022</a></blockquote>\n\n`,
      },
      { url: POST_URL, postId: POST_ID },
    )

    expect(parsed).toMatchObject({
      lang: 'en',
      dir: 'ltr',
      authorName: 'Matt Pocock',
      authorHandle: 'mattpocockuk',
      authorUrl: 'https://x.com/mattpocockuk',
      publishedLabel: 'April 1, 2022',
    })
    expect(parsed.content).toEqual([
      { type: 'text', value: 'A useful post' },
      { type: 'break' },
      { type: 'break' },
      { type: 'text', value: 'See ' },
      {
        type: 'link',
        url: 'https://t.co/example',
        title: null,
        children: [{ type: 'text', value: 'example' }],
      },
    ])
  })

  it('rejects provider HTML outside the allowlisted inline surface', () => {
    expect(() =>
      parseXEmbedOEmbed(
        {
          url: POST_URL,
          author_name: 'Matt Pocock',
          author_url: 'https://x.com/mattpocockuk',
          html: `<blockquote class="twitter-tweet"><p>Text<script>alert(1)</script></p><a href="${POST_URL}">April 1, 2022</a></blockquote>`,
        },
        { url: POST_URL, postId: POST_ID },
      ),
    ).toThrow('unsupported <script>')
  })

  it.each([
    [
      'an image anywhere in the provider blockquote',
      `<blockquote class="twitter-tweet"><p>Text</p><img src="https://example.com/tracker.gif"><a href="${POST_URL}">April 1, 2022</a></blockquote>`,
      'unsupported <img>',
    ],
    [
      'an unsafe post link',
      `<blockquote class="twitter-tweet"><p>Text <a href="javascript:alert(1)">bad</a></p><a href="${POST_URL}">April 1, 2022</a></blockquote>`,
      'Unsafe or malformed URL',
    ],
  ])('rejects %s', (_label, html, message) => {
    expect(() =>
      parseXEmbedOEmbed(
        {
          url: POST_URL,
          author_name: 'Matt Pocock',
          author_url: 'https://x.com/mattpocockuk',
          html,
        },
        { url: POST_URL, postId: POST_ID },
      ),
    ).toThrow(message)
  })
})

describe('X embed enrichment', () => {
  it('normalizes a Notion X embed with its post identifier', () => {
    const embed = xEmbed(sourceDocument())
    expect(embed).toMatchObject({
      type: 'xEmbed',
      url: POST_URL,
      postId: POST_ID,
      embed: null,
    })
  })

  it('fetches each unique post once and enriches every occurrence', async () => {
    let calls = 0
    const source = sourceDocument()
    const result = await enrichXEmbeds([source, source], async () => {
      calls += 1
      return enrichedData
    })

    expect(calls).toBe(1)
    expect(result).toMatchObject({ total: 2, enriched: 2, fallback: 0, failures: [] })
    expect(xEmbed(result.documents[0]!).embed).toEqual(enrichedData)
    expect(xEmbed(result.documents[1]!).embed).toEqual(enrichedData)
  })

  it('keeps the safe link fallback when provider enrichment fails', async () => {
    const result = await enrichXEmbeds([sourceDocument()], async () => {
      throw new Error('provider unavailable')
    })

    expect(result).toMatchObject({
      total: 1,
      enriched: 0,
      fallback: 1,
      failures: [{ url: POST_URL, message: 'provider unavailable' }],
    })
    expect(xEmbed(result.documents[0]!).embed).toBeNull()
  })

  it('cancels an oEmbed response as soon as its streamed body exceeds the limit', async () => {
    const cancel = vi.fn()
    const chunks = [new Uint8Array(96 * 1024), new Uint8Array(40 * 1024)]
    let index = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        const chunk = chunks[index]
        index += 1
        if (chunk) controller.enqueue(chunk)
      },
      cancel,
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, { status: 200 }))

    await expect(fetchXEmbedData(xEmbed(sourceDocument()))).rejects.toThrow(
      'X oEmbed response exceeds 131072 bytes',
    )
    expect(cancel).toHaveBeenCalledOnce()
  })
})

function sourceDocument() {
  return parseMusubiMarkdown(`<unknown alt="tweet" url="${POST_URL}" />`, {
    pageLabel: 'X embed fixture',
  })
}

function xEmbed(document: ReturnType<typeof sourceDocument>): MusubiXEmbed {
  const block = document.children[0]
  expect(block?.type).toBe('xEmbed')
  return block as MusubiXEmbed
}