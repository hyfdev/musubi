# Musubi Project Goal

## Status

This is the selected product goal for the current architecture and implementation.

## Goal

Musubi is an opinionated, Notion-backed framework for Yunfei's personal website. It turns articles, an optional authored Home opening, standalone pages, and public site settings maintained in Notion into a static website at deployment.

## Success

Musubi succeeds when Yunfei can use Notion as the single editing surface and each deployment either publishes a complete, readable, visually intentional static site from the data fetched for that build or fails clearly without silently omitting or corrupting required content. An ordinary user can fork Musubi, connect a compatible Notion workspace, and deploy the default website without changing source code or a local configuration file.

## Required website surface

The default website provides an optional authored Home opening followed by five recent Posts, a complete unpaginated chronological Blog archive, Post pages, and standalone Pages. Tags may remain article metadata, but the default website does not expose tag routes. Additional collections, taxonomies, and user-defined page types are added only for a concrete Yunfei requirement.

## Audience and requirement priority

- Musubi primarily serves Yunfei, and Yunfei's own needs remain the main source and driver of its requirements.
- The fork-and-deploy path is a Yunfei-selected requirement. Other ordinary-user needs are considered, but they do not block Yunfei-driven work, take priority over Yunfei's requirements, or redefine the project around downstream users.

## Defining qualities

Musubi must remain straightforward for Yunfei to reshape, publish complete content reliably, present that content with an intentional visual system, and keep deployment operationally small. Required content must never be silently omitted or corrupted.

## Non-goals

Musubi is not a generic CMS, an in-app site editor, a multi-source content platform, a component library, a plugin ecosystem, or an independently versioned framework package. It does not promise a stable layer, extension API, or upgrade path for downstream forks. It does not promise support for every Notion block, browser, hosting platform, or downstream source modification. Behavior from an earlier implementation is preserved only when Yunfei selects it for the future product.

## Deferred

Automatically triggering a deployment when Notion changes is deliberately deferred. The initial product contract starts when a deployment build runs; it does not yet define what starts that build.