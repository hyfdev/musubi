# Musubi Font Sources

Musubi does not commit upstream font binaries. The build writes generated public font artifacts under `public/_musubi/generated/fonts/` and records their sources, coverage, and checksums in `fonts-manifest.json`.

## Charter and JetBrains Mono

`font:setup` downloads and verifies four Charter WOFF2 faces and four JetBrains Mono WOFF2 faces into the ignored `.musubi/font/latin/` cache. Charter is pinned to the files from Butterick's Practical Typography package as mirrored at `chawyehsu/charter-webfont` commit `149bc9ee81cc87b78152df8fce207823969873f8`; JetBrains Mono is pinned to official release `v2.304`. Exact sizes, SHA-256 checksums, URLs, weights, and styles live in `scripts/font/latin-fonts.ts`.

The build generates content-derived subsets for every declared style, gives each output a content hash, and ships `LICENSE-Charter.txt` and `OFL-JetBrains-Mono.txt` beside the fonts. Charter's original notice permits use, modification, sublicensing, sale, and redistribution while retaining that notice. JetBrains Mono remains under SIL Open Font License 1.1. Musubi's root MIT license does not replace either font license.

## Tsanger JinKai 02

Tsanger JinKai 02 W04 is the preferred Chinese body face and W05 is the preferred Chinese heading and emphasis face. Full source files are never committed. The default pipeline runs `vp run font:setup` from `postinstall`, `dev`, and `site:build`: a missing verified cache downloads the pinned W04/W05 pair (jsDelivr first, then `tsanger.cn`, or paired `MUSUBI_TSANGER_W04_URL` / `MUSUBI_TSANGER_W05_URL` when both are set), verifies exact size and SHA-256, and installs the pair in the ignored private `.musubi/font/tsanger/` cache. Setup only makes a verified complete pair visible to later builds; download or verification failure stops the pipeline. `MUSUBI_TSANGER_SETUP=0` skips the download attempt (use `vp run font:setup -- --clear` if an existing cache must not be used). `MUSUBI_TSANGER_CACHE_DIR` may select another private Tsanger cache directory for cloud builds or shared local storage.

The build checks paired `MUSUBI_TSANGER_W04_PATH` and `MUSUBI_TSANGER_W05_PATH` overrides first (for `font:build` only), then the verified setup cache. When neither source is present, the public build remains complete and uses the open-licensed fallback family. Supplying only one explicit path is an error because it would silently collapse the accepted two-weight hierarchy. Setup writes its activation marker only after both pinned files pass verification, so an interrupted first setup is not activated. Once activated, a missing or corrupt source fails the build with repair and clear commands instead of silently changing typography.

The person building and publishing a deployment is responsible for ensuring that their Tsanger license covers the resulting webfont use and distribution. Musubi's root MIT license does not relicense third-party font files or generated font derivatives.

## Musubi CJK Fallback

`Musubi CJK Fallback` is derived from [`LXGW WenKai GB`](https://github.com/lxgw/LxgwWenKaiGB) Medium release `v1.522`, asset `LXGWWenKaiGB-Medium.ttf`, SHA-256 `b885c51ec0d3f325974013801dfcefda1a9ba0bf385c607cf5f2582dafa2e5ab`. The repository carries a verified, renamed, complete-coverage WOFF2 source pool under `scripts/font/prebuilt-fallback/`; ordinary builds do not copy that pool into the deployment. They generate public subsets only for build-known Chinese typography mappings absent from either selected Tsanger source. These subsets contain no ASCII or unrelated Latin mappings, and unknown text introduced after deployment continues to the system fallback.

The deployment host serves generated font files and the content-addressed font stylesheet with `Cache-Control: public, max-age=31536000, immutable`. A changed source, tool output, or glyph set produces a different URL; the stable `fonts-manifest.json` records the matching files and revalidates normally.

Generated subsets use the non-reserved `Musubi CJK Fallback` identity, retain copyright and OFL metadata, ship SIL Open Font License 1.1, and are validated before publication. A required build-time Chinese typography mapping absent from both its applicable Tsanger source and the verified LXGW pool fails generation rather than silently switching to an unrelated system face.