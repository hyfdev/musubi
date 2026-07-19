# Gotchas

Traps already paid for in this repository. Each entry states what not to do, why, and what would make the trap obsolete.

## Nuxt dev warnings with Vite+ (`NUXT_B5004`, `NUXT_B2005`)

- **Do not** delete root `vite.config.ts`, move Vite+ `fmt` / `lint` / `staged` / `run.tasks` into `nuxt.config` `vite`, or open work to "fix" these two messages on their own.
- **`NUXT_B5004` (external `vite.config.ts`):** Nuxt 4.5 warns that standalone bundler configs are unsupported and suggests merging into `nuxt.config`. Musubi's root `vite.config.ts` is the Vite+ toolchain file (tasks, fmt, lint, staged hooks), not Nuxt's Vite builder config. Nuxt maintainers document that Vite+ **requires** a separate `vite.config.ts` and does **not** work under `nuxt.config` `vite`; the warning is expected coexistence noise. Real Vite builder options still belong only under `nuxt.config` `vite`. Evidence: [NUXT_B5004](https://nuxt.com/docs/4.x/errors/b5004), [nuxt#34857](https://github.com/nuxt/nuxt/discussions/34857).
- **`NUXT_B2005` (`check-if-page-unused` has no default export):** False positive on Nuxt's own pages plugin in `4.5.0`. The compiled file uses `export { plugin as default, ... }`; export detection missed multi-export default re-exports. Fixed upstream in [nuxt#35676](https://github.com/nuxt/nuxt/pull/35676) (issue [nuxt#35664](https://github.com/nuxt/nuxt/issues/35664)); expect the warning to disappear on a Nuxt patch/nightly that includes that fix—not via project plugins or `pnpm patch` unless something forces it.
- **Ruling until then:** ignore both in dev logs; do not treat them as blockers for `dev`, `site:build`, or review.

## Global CSS path under Nuxt 4 `app/` + Vite 8

- **Do not** list app CSS as `./app/assets/...` in `nuxt.config` `css`.
- With default Nuxt 4 layout, `srcDir` is `app/`, and `~/` / `@/` alias to that directory. Prefer `~/assets/css/main.css`. Relative `./app/...` paths are written into `virtual:nuxt:.nuxt/css.mjs` and fail to resolve under Vite 8 (`Failed to resolve import "./app/assets/css/main.css"`), so HTML can still SSR while main site styles 404.

## Cloudflare Workers Build command vs Vite+ task rename

- Renaming the offline pipeline from `check:build` to `site:build` only updates the repository. The Workers Build **dashboard** build command is outside Git (`pnpm exec vp run check:build` was still configured when the rename shipped).
- Symptom: install/`font:setup` succeed, then `Task "check:build" not found` and the deploy fails.
- Mitigation in-repo: Vite+ task `check:build` is a thin alias of `site:build` so an outdated dashboard command still builds. Canonical docs and new setup use `pnpm exec vp run site:build` only.
- When changing task names that appear in Cloudflare (or any external CI), update that external command in the same change or keep a temporary alias until the dashboard is updated.