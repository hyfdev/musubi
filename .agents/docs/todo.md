# Project Todo

This record owns pending or deferred repository work that does not yet have an active scoped implementation plan. When work starts, move the item into a scoped plan or replace it with a link to that plan.

## Deferred

- [ ] Add an explicit authoring signal for the accepted `1120px` and viewport-edge non-prose width tiers, potentially using image or media Caption metadata.
  - **Deferred by:** Yunfei on 2026-07-15.
  - **Gate:** Keep every supported non-prose block in the `720px` tier until this work is explicitly resumed. Do not infer width intent from the asset or Notion layout.
  - **Accepted syntax family:** When image-layout authoring is designed, provide both a contextual shortcut and a complete `{key=value}` declaration, following the accepted Callout declaration model.
  - **Open contract:** Caption metadata is a recorded possible direction, but the shortcut, key, value, marker placement, validation, grouping behavior, and interaction with visible captions and alternative text remain undecided.