# Musubi Design Decisions

## Purpose

This file records Yunfei's explicit visual requirements, preferences, and rejections for Musubi. Future design work must read it before proposing or implementing a visual direction.

This is not an AI-generated design specification. [DESIGN.md](./DESIGN.md) may translate accepted decisions into concrete colors, typography, spacing, layout, and component rules, but the current implementation and `DESIGN.md` do not prove that Yunfei prefers those choices.

Record a preference only after Yunfei has stated or selected it. A coherent proposal, a completed implementation, a passing browser review, resemblance to a reference, or the absence of an objection does not imply acceptance.

## Current state

- **2026-07-14 — Current overall style:** Yunfei does not like the current overall visual design.
- This is an overall reaction, not a separate rejection of every current color, typeface, layout choice, or component.
- No replacement visual direction has been recorded yet.

## Decisions

### Dark-theme brand-color derivation

- **Date:** 2026-07-14.
- **Status:** Required.
- **Scope:** How Musubi turns its single light-mode brand color into the single corresponding dark-mode brand color. This decision governs the shared brand value, not component-specific state treatments.
- **Decision:** Keep the light-mode brand color as the source of truth and generate the dark-mode brand color with the versioned derivation recorded in [the PCR record](./.agents/docs/dark-brand-color-derivation.md). The public derivation accepts one brand seed and returns one dark-mode brand color. The approved dark backgrounds remain fixed internal Musubi context so the generated result is readable wherever the shared brand color is used; they are not additional settings that callers provide. Whenever the light-mode brand color changes, run the same derivation to replace the corresponding dark-mode brand color rather than choosing a second color by eye.
- **Current result:** With seed `#1B365D`, the current dark usage backgrounds `#141413`, `#30302E`, and `#26364B`, and algorithm v2, the generated dark-mode brand color is `#82A1D9`. This hex is the current output, not a permanently selected substitute for the seed.
- **Regeneration:** Change the seed in the implementation, run `vp run brand:update`, inspect the regenerated light and dark themes, and commit the seed, generated CSS, and any affected records together. A change to an approved dark background also requires regeneration because background contrast is an existing internal constraint of the derivation.
- **Reason or reference:** Yunfei wants future brand-color changes to produce the corresponding dark-mode brand color automatically. The perceptual target follows the complete model and hue correction supplied with [Kim, Lee, and Suk's 2026 dark-mode brand-color experiment](https://doi.org/10.1371/journal.pone.0339392); Musubi then constrains the stored sRGB result against its actual dark backgrounds and [WCAG 2.2 contrast minimum](https://www.w3.org/TR/WCAG22/#contrast-minimum). The study's scope and Musubi-specific safeguards are recorded in the linked PCR record.

### Overall visual direction

- **Status:** Open.
- **Current implementation:** Not accepted as the overall direction.
- **Recorded requirements:** None yet beyond the current overall rejection.

## Recording format

Add each requirement or decision under `Decisions` with:

- **Date:** When Yunfei stated or selected it.
- **Status:** Required, preferred, rejected, open, or superseded.
- **Scope:** The pages, themes, content, or components it covers.
- **Decision:** What Yunfei wants or does not want, in plain language.
- **Reason or reference:** Include only when Yunfei provided one.

Do not fill missing fields by guessing. Leave an unresolved choice open until Yunfei decides it.