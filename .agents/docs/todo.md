# Project Todo

This record owns pending or deferred repository work that does not yet have an active scoped implementation plan. When work starts, move the item into a scoped plan or replace it with a link to that plan.

## Deferred

- [ ] Render a Callout that carries no role marker with its Notion source presentation, and keep the semantic Musubi treatment for explicit `{note}`, `{warning}`, and `{error}`.
  - **Deferred by:** Yunfei on 2026-07-21.
  - **Intent:** A Callout the author never marked should not look markedly different on the published site from what that author sees in Notion. The Note / Warning / Error presentation becomes an explicit opt-in instead of the silent default.
  - **Reverses a vouched decision:** This contradicts **Callout source icon and color are model-only** in [`DESIGN-decisions.md`](./DESIGN-decisions.md). Yunfei accepted overturning it on 2026-07-21. Rewrite that entry and have him re-vouch it as part of this work; do not start rendering the fields while the entry still reads "never render".
  - **Model gap, and the prerequisite:** The AST cannot express "no role" today. `MusubiCalloutRole` is `'note' | 'warning' | 'error'`, and `extractCalloutDeclaration` in `shared/content/normalize.ts` returns `note` both for an absent marker and for an explicit `{note}`. Separating those two cases comes before any renderer work.
  - **Open questions:** What an unrecognized marker such as `{info}` should resolve to, given it currently falls back to `note` and leaves its literal text in the body. Whether the dark theme approximates Notion's own dark tints or derives its tints from the light mapping — Musubi's warm near-black sheet cannot reproduce Notion's neutral dark canvas, so close fidelity is only reachable in the light theme. Contrast validation for the nine background tints against the four neutral text levels in both themes, under the WCAG 2.2 targets the design system already commits to.
  - **Known data limit:** Notion assigns a default icon to Callouts whose author never chose one, so the `icon` field cannot separate an authored icon from an untouched default. Under this intent that is acceptable, because the site is meant to show what the author sees, but it does mean most Callouts will carry Notion's default bulb.

- [ ] Add an explicit authoring signal for the accepted `1120px` and viewport-edge non-prose width tiers, potentially using image or media Caption metadata.
  - **Deferred by:** Yunfei on 2026-07-15.
  - **Gate:** Keep every supported non-prose block in the `720px` tier until this work is explicitly resumed. Do not infer width intent from the asset or Notion layout.
  - **Accepted syntax family:** When image-layout authoring is designed, provide both a contextual shortcut and a complete `{key=value}` declaration, following the accepted Callout declaration model.
  - **Open contract:** Caption metadata is a recorded possible direction, but the shortcut, key, value, marker placement, validation, grouping behavior, and interaction with visible captions and alternative text remain undecided.