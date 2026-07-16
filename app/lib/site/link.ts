import type { InjectionKey } from 'vue'

export const siteLinkKey: InjectionKey<string> = Symbol('musubi-site-link')

export function isExternalSiteLink(value: string, siteLink: string): boolean {
  let target: URL
  let site: URL
  try {
    target = new URL(value, siteLink)
    site = new URL(siteLink)
  } catch {
    return false
  }

  return (
    (target.protocol === 'http:' || target.protocol === 'https:') && target.origin !== site.origin
  )
}