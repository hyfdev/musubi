# Dark Brand Color Derivation

## Outcome

Musubi has one light-mode brand seed and deterministically derives one corresponding dark-mode brand color. Product code consumes the two stored colors; it does not run the model in the browser or generate a palette of component-specific colors.

The current seed is `#A64156`. Algorithm v2 generates `#E78394` for the current places where the color appears: the page background `#141413`, strong surface `#30302E`, and selected-state background `#26364B`. The generated hex is a consequence of the seed, algorithm, those usage contexts, and contrast requirements, not an independently selected permanent brand color.

## Public boundary

`deriveDarkBrandColor(seed)` accepts only the light-mode brand seed and returns one dark-mode brand color. The backgrounds where that color is used are fixed Musubi design context inside the implementation, not an additional input that site owners pass on each call. If those usages or backgrounds change, the internal checks and generated result must change together.

## Algorithm

1. Run the complete lightness, chroma, and hue-correction model supplied with Kim, Lee, and Suk's 2026 dark-mode brand-logo experiment to obtain a perceptual target.
2. Gradually reduce that model's influence for seeds below OKLCH chroma `0.04`, because the study identifies low-chroma colors as insufficiently validated. The `0.04` transition is a Musubi safeguard, not a value reported by the paper.
3. Map out-of-gamut candidates into stored 8-bit sRGB by reducing chroma at fixed OKLCH lightness and hue instead of clipping RGB channels independently.
4. Search the predicted tone and choose the stored sRGB candidate closest to the perceptual target in OKLab that reaches at least `4.7:1` against every approved dark background and allows either `#141413` or white text to reach at least `4.5:1` on the generated color.

The `4.7:1` foreground threshold preserves Musubi's small margin above WCAG 2.2's `4.5:1` minimum for ordinary text. Because the same brand color is also used for focus and filled controls, the verifier checks the actual stored color pairs rather than assuming a perceptual target is accessible.

## Source and limits

The perceptual model is transcribed from Kim, Lee, and Suk, [“Color adjustment of brand logos for dark mode display”](https://doi.org/10.1371/journal.pone.0339392), and the authors' [supporting model code and hue table](https://doi.org/10.1371/journal.pone.0339392.s001). The study adjusted 18 source colors on a black background in low ambient light and validated preferences with a mostly young Korean participant group. It directly supports a research-informed default for dark logo colors; it does not prove a universal optimum for every display, background, component, or audience. Musubi therefore treats the model as a preference target and keeps actual contrast requirements as hard constraints.

## Implementation and regeneration

- [`scripts/brand/color.ts`](../../scripts/brand/color.ts) owns the one-input/one-output derivation and the fixed backgrounds where the result is used.
- [`scripts/brand/model.ts`](../../scripts/brand/model.ts) owns the attributed numeric model and hue table.
- [`src/assets/css/brand.generated.css`](../../src/assets/css/brand.generated.css) stores the current light and dark values consumed by application CSS.
- `vp run brand:update` runs the full verification and rewrites the generated CSS after the brand seed or approved dark backgrounds change.
- `vp run brand:check` quickly verifies the paper and generated reference vectors plus the committed generated CSS. Normal generation and visual development run this check before proceeding.
- `vp run brand:verify` additionally scans 216 representative sRGB inputs for contrast and checks adjacent-input continuity. `vp run ready` includes this full verification.

After changing the brand seed, run `vp run brand:update`, inspect the light and dark site in the real browser acceptance matrix, and commit the seed, generated CSS, and any affected design records together.