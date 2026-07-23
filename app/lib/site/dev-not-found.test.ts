import { describe, expect, it } from 'vite-plus/test'
import { shouldRewriteUnknownDocumentRequest } from './dev-not-found.ts'

const routes = ['/', '/blog', '/blog/example']

function shouldRewrite({
  method = 'GET',
  accept = 'text/html,application/xhtml+xml',
  pathname = '/missing',
}: {
  method?: string
  accept?: string
  pathname?: string
} = {}): boolean {
  return shouldRewriteUnknownDocumentRequest({ method, accept, pathname, routes })
}

describe('development not-found document rewrite', () => {
  it('rewrites an unknown HTML document request', () => {
    expect(shouldRewrite()).toBe(true)
    expect(shouldRewrite({ method: 'HEAD' })).toBe(true)
  })

  it('does not rewrite known pages or framework paths', () => {
    expect(shouldRewrite({ pathname: '/blog' })).toBe(false)
    expect(shouldRewrite({ pathname: '/404' })).toBe(false)
    expect(shouldRewrite({ pathname: '/assets/app-deadbeef.js' })).toBe(false)
    expect(shouldRewrite({ pathname: '/_void/pages/index.json' })).toBe(false)
  })

  it('does not turn missing resources or mutations into HTML success responses', () => {
    expect(shouldRewrite({ pathname: '/missing.png', accept: 'image/avif,image/webp,*/*' })).toBe(
      false,
    )
    expect(shouldRewrite({ pathname: '/missing.js', accept: '*/*' })).toBe(false)
    expect(shouldRewrite({ method: 'POST' })).toBe(false)
    expect(shouldRewrite({ accept: 'text/html;q=0,*/*;q=0.8' })).toBe(false)
  })
})