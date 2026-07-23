interface UnknownDocumentRequest {
  method: string
  accept: string | undefined
  pathname: string
  routes: readonly string[]
}

function acceptsHtml(value: string | undefined): boolean {
  if (!value) return false

  return value.split(',').some((range) => {
    const [mediaType, ...parameters] = range.split(';').map((part) => part.trim())
    if (mediaType?.toLowerCase() !== 'text/html') return false

    const quality = parameters.find((parameter) => parameter.toLowerCase().startsWith('q='))
    return quality === undefined || Number(quality.slice(2)) > 0
  })
}

function isFrameworkOrAssetRequest(pathname: string): boolean {
  return (
    ['/favicon.ico', '/robots.txt'].includes(pathname) ||
    [
      '/_headers',
      '/assets/',
      '/_void/',
      '/_musubi/',
      '/@',
      '/app/',
      '/shared/',
      '/node_modules/',
    ].some((prefix) => pathname.startsWith(prefix))
  )
}

export function shouldRewriteUnknownDocumentRequest({
  method,
  accept,
  pathname,
  routes,
}: UnknownDocumentRequest): boolean {
  return (
    ['GET', 'HEAD'].includes(method.toUpperCase()) &&
    acceptsHtml(accept) &&
    pathname !== '/404' &&
    !routes.includes(pathname) &&
    !isFrameworkOrAssetRequest(pathname)
  )
}