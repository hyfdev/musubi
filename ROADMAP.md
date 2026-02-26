# Musubi Roadmap

Musubi is a forkable blog framework: fork the repo, duplicate the Notion template, set env vars, deploy.

## Phase 1: Foundation

- [x] Description field — rename `Summary` → `Description` in Notion, wire through code
- [x] OG/Twitter meta tags — `og:title`, `og:description`, `og:type`, `twitter:card`
- [x] Config caching — `resolveWebsiteConfig()` promise cache
- [x] Show descriptions in post listings on home page
- [x] Site-level `description` from config in home page meta

## Phase 2: SEO & Accessibility

- [ ] Sitemap generation (`nuxt-simple-sitemap` or custom)
- [ ] Canonical URLs on all pages
- [ ] RSS feed (`/feed.xml`)
- [ ] Focus styles for keyboard navigation
- [ ] ARIA attributes on interactive elements
- [ ] Skip-to-content link

## Phase 3: Features

- [x] Tag display on post pages
- [x] Tag listing page (`/tags`)
- [x] Tag filter page (`/tags/[tag]`)
- [x] Custom 404 page
- [x] Pagination for post listings
- [ ] Search (client-side or build-time index)
- [ ] Photo gallery page type (design TBD)

## Phase 4: DX & Infrastructure

- [ ] `.env.example` with documented variables
- [ ] GitHub Actions CI (types, lint, format, build)
- [ ] Type-safe config (validate `WebsiteConfig` shape)
- [ ] Schema validation with warnings for missing Notion properties
- [ ] Setup guide for new forks

## Open Questions

- **Notion schema migrations**: How to handle breaking schema changes for existing users? Options: notify via README, automate detection, or maintain backwards compatibility only.
- **Gallery page type**: Dedicated Notion database or a new `Type` value (`Gallery`) in the existing Published Pages database?
- **Search implementation**: Build-time search index (e.g., MiniSearch) vs. external service?
