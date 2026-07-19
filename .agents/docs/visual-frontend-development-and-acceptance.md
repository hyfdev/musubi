# Visual Frontend Development and Acceptance

## Status and purpose

This record defines the required visual feedback and acceptance loop for Musubi user-interface work. It is independent of a particular browser-control product and does not create an automated browser test suite.

The loop must prove more than compilation and DOM structure. For every user-facing change, an agent must exercise the affected workflow in a real browser, inspect the rendered pixels, inspect browser failures, compare the result with the applicable design direction, and use the findings to guide another implementation pass when needed.

## Scope

Use this loop for changes to visible UI, layout, content presentation, themes, responsive behavior, keyboard or pointer interaction, focus, accessibility, and user-visible application states. A code-only change with no observable effect may skip a new visual pass only when the agent states why the visible boundary cannot change.

## Programmatic checks do not replace visual acceptance

- Focused unit tests, formatting, linting, Vue-aware type checking, and the Nuxt production build are programmatic checks, not substitutes for visual acceptance.
- Musubi does not currently maintain a committed browser or end-to-end test suite. Interactive browser acceptance remains an inspected development workflow rather than a project dependency.
- Interactive browser control may use `agent-browser`, a Playwright or Chrome DevTools wrapper, direct browser tooling, or another controller with the required capabilities. The controller is not a Musubi dependency or a project-level source of truth.

## Required loop

### 1. Establish the intended result

- Read the project records that cover the change and [DESIGN.md](./DESIGN.md) for visual identity, exact tokens, responsive rules, and supported theme direction.
- State the affected workflow in user terms, including the visible starting state, action, important intermediate states, final state, and relevant failure state.
- Identify the viewport, theme, content fixture, and browser conditions that can change the result.

### 2. Implement one coherent change

- Change only what the intended result requires.
- Expose clear application states and accessible names when the interface would otherwise be difficult to observe reliably.
- Do not add fixed delays or test-only behavior to make browser control appear stable.

### 3. Run the programmatic gate

- Use the repository's focused format, lint, type-check, and build scripts during implementation.
- Run `vp run ready` before final visual acceptance. Root `vite.config.ts` under `run.tasks` owns the current `ready` composition and task cache settings; `package.json` owns the leaf scripts those tasks call. [Target Technology Stack](./technology-stack.md) owns the Vite+ entry point and no-cache rule. The completed [Implementation Migration Plan](./migration-plan.md) is historical migration evidence and does not own the live task graph. This workflow consumes that gate rather than defining a second one.
- Repair deterministic failures before treating browser observations as acceptance evidence.

### 4. Start the static production surface

- Serve `.output/public` without `.output/server` for final acceptance. A development server is suitable for rapid iteration but does not prove that the static production artifact loads correctly.
- Use an available explicit port and fail on collisions so concurrent worktrees cannot accidentally inspect another server.
- Wait for an explicit ready state rather than a fixed sleep.

### 5. Exercise the affected workflow

- Start from a known content and browser state.
- Exercise `/`, `/blog`, one `/blog/:slug` Post, one `/:slug` Page, one missing route, and direct entry plus hard refresh for each affected route family. Confirm that Home contains at most five recent Posts, Blog contains the complete year-grouped archive, no paginated Blog or tag route is exposed, and no broken navigation entry appears.
- Inspect navigation with visible, hidden, ordered, and missing-order Page rows when those states are affected. For an affected X post reference, verify the safe ordinary X-link representation on direct entry and client-side navigation. Verify that Notion refresh, static generation, and browser rendering make no X metadata, oEmbed, widget-script, iframe, or other X provider request.
- Perform the actual user actions needed to reach the affected state, including keyboard, pointer, focus, hover, scroll, or responsive interactions when relevant.
- Inspect page errors, console errors, failed transport requests, HTTP responses with status `400` or higher, and unexpected application warnings.
- Check loading, success, empty, failure, and recovery states when the change affects them.

### 6. Inspect the rendered pixels

- Capture a normal screenshot without diagnostic overlays, load it into visual input, and inspect it. Taking a screenshot without looking at it is not a visual review.
- Inspect the full relevant viewport and a closer view when small controls or text need judgment.
- Inspect information hierarchy, alignment, clipping, overlap, scroll behavior, typography, density, contrast, focus, selection, disabled and busy states, responsive behavior, and accessibility cues.
- Check that diagnostics and state differences do not rely on color alone and that interactive controls have usable names and visible focus.

Use this default matrix, narrowing it only when an axis cannot be affected:

| Context               | Viewport                                   | Theme                                | Purpose                                        |
| --------------------- | ------------------------------------------ | ------------------------------------ | ---------------------------------------------- |
| Primary desktop       | `1440x900`                                 | Explicit light                       | Main hierarchy, density, and layout            |
| Desktop theme variant | `1440x900`                                 | Explicit dark                        | Color, contrast, borders, focus, and selection |
| Narrow viewport       | `390x844`                                  | Same theme as its desktop comparison | Responsive arrangement and horizontal overflow |
| Focused regression    | Dimensions and theme that expose the issue | Explicit                             | Confirm the exact visible failure is gone      |

### 7. Iterate on findings

- A broken primary path, unreadable content, inaccessible required control, misleading state, browser crash, or major layout failure blocks completion.
- Fix clear usability, hierarchy, responsive, consistency, or accessibility problems caused by the change; record unrelated problems as concrete follow-up work.
- After each fix, repeat the narrowest programmatic and browser steps that can catch a regression, then inspect the final pixels again.
- Stop subjective polishing when the recorded direction is satisfied and only low-impact preferences remain.

### 8. Report acceptance evidence

Report the exact revision, programmatic commands, browser and version, application URL and server mode, viewport and theme, content state, user actions, visible result, browser errors or their absence, diagnostic artifact paths, and remaining gaps. Temporary screenshots and browser artifacts diagnose one run; the reproducible command, verified revision, and concise report are the durable evidence.

## Command integration

Root `vite.config.ts` under `run.tasks` owns the current `ready` composition and task cache settings; `package.json` owns the leaf scripts those tasks call. The target technology-stack record owns the selected Vite+ entry point and cache policy. The completed migration plan retains historical scaffolding and acceptance evidence only. This workflow uses the resulting complete `ready` gate and any focused visual scripts that provide a meaningfully shorter path to one representative surface or content state; it does not define an alternative command graph.

## Completion conditions

Visual acceptance is complete only when:

- `vp run ready` passes.
- The affected workflow succeeds in a real browser on the relevant viewport and theme matrix.
- The agent has inspected the final rendered pixels rather than only DOM or screenshot metadata.
- No unexpected page error, console error, failed request, HTTP error response, or application warning remains.
- No blocking interaction, readability, accessibility, or layout finding remains.
- The evidence report identifies exactly what ran, what was observed, and any remaining gap.

## Source adapted

This workflow was adapted from Yunfei's draft `visual-frontend-devlopment-feedback-loops.md` for Rolldown Playground. Musubi deliberately omits that draft's committed Playwright Test scenarios, CI browser matrix, product-specific WebContainer behavior, and test-artifact policy.