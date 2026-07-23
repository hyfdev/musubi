import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineMiddleware } from 'void'
import { shouldRewriteUnknownDocumentRequest } from '../lib/site/dev-not-found.ts'
import { interactionScript } from '../lib/site/interaction-script.ts'
import { getSite } from '../server/site/get-site.ts'
import type { PublicSiteShell } from '../shared/site/public.ts'

declare module 'void' {
  interface CloudContextVariables {
    shared: PublicSiteShell
  }
}

function generatedFontCssHref(): string {
  const directory = resolve('public/_musubi/generated/fonts')
  const files = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^fonts-[0-9a-f]{16}\.css$/u.test(entry.name))
    .map((entry) => entry.name)
    .sort()

  if (files.length !== 1) {
    throw new Error(
      `Expected one generated font stylesheet before starting Void, found ${files.length}`,
    )
  }
  return `/_musubi/generated/fonts/${files[0]}`
}

export default defineMiddleware(async (c, next) => {
  const site = await getSite()
  const pathname = c.req.path === '/' ? '/' : c.req.path.replace(/\/+$/u, '')
  if (
    import.meta.env.DEV &&
    shouldRewriteUnknownDocumentRequest({
      method: c.req.method,
      accept: c.req.header('accept'),
      pathname,
      routes: site.routes,
    })
  ) {
    // Void 0.10.10's Node dev server cannot read the generated 404 asset before a build. Reuse
    // the real 404 page in development; the deployed static host still serves 404.html with 404.
    return c.rewrite('/404')
  }

  c.set('shared', {
    config: site.config,
    navigation: site.navigation,
  })
  c.set('headDefaults', {
    title: site.config.title,
    htmlAttrs: { lang: site.config.lang },
    meta: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'color-scheme', content: 'light dark' },
      { name: 'description', content: site.config.description },
    ],
    link: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: generatedFontCssHref() },
    ],
    script: [{ innerHTML: interactionScript }],
  })
  await next()
})