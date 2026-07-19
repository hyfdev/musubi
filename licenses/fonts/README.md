# Musubi Font Sources

Musubi does not commit upstream font binaries. The build writes generated public font artifacts under `public/_musubi/generated/fonts/` and records their sources, coverage, and checksums in `fonts-manifest.json`.

## Tsanger JinKai 02

Tsanger JinKai 02 W04 is the preferred Chinese body face and W05 is the preferred Chinese heading and emphasis face. Full source files are never committed. The default pipeline runs `vp run font:setup` from `postinstall`, `dev`, and `site:build`: a missing verified cache downloads the pinned W04/W05 pair (jsDelivr first, then `tsanger.cn`, or paired `MUSUBI_TSANGER_W04_URL` / `MUSUBI_TSANGER_W05_URL` when both are set), verifies exact size and SHA-256, and installs the pair in the ignored private `.musubi/font/tsanger/` cache. Setup only makes a verified complete pair visible to later builds; download or verification failure stops the pipeline. `MUSUBI_TSANGER_SETUP=0` skips the download attempt (use `vp run font:setup -- --clear` if an existing cache must not be used). `MUSUBI_TSANGER_CACHE_DIR` may select another private Tsanger cache directory for cloud builds or shared local storage.

The build checks paired `MUSUBI_TSANGER_W04_PATH` and `MUSUBI_TSANGER_W05_PATH` overrides first (for `font:build` only), then the verified setup cache. When neither source is present, the public build remains complete and uses the open-licensed fallback family. Supplying only one explicit path is an error because it would silently collapse the accepted two-weight hierarchy. Setup writes its activation marker only after both pinned files pass verification, so an interrupted first setup is not activated. Once activated, a missing or corrupt source fails the build with repair and clear commands instead of silently changing typography.

The person building and publishing a deployment is responsible for ensuring that their Tsanger license covers the resulting webfont use and distribution. Musubi's root MIT license does not relicense third-party font files or generated font derivatives.

## Musubi CJK Fallback

`Musubi CJK Fallback` is generated from [`LXGW WenKai GB`](https://github.com/lxgw/LxgwWenKaiGB) Medium release `v1.522`, asset `LXGWWenKaiGB-Medium.ttf`, SHA-256 `b885c51ec0d3f325974013801dfcefda1a9ba0bf385c607cf5f2582dafa2e5ab`. The build downloads the pinned source into the ignored `.musubi/font/` cache, verifies it, and emits every mapped source code point across a complete set of Unicode-range WOFF2 shards rather than trimming the fallback to the current article corpus. Each public shard filename includes its generated-content hash. A browser therefore downloads only the shards needed by the current page, while later runtime content can still resolve against the complete published fallback and safely reuse long-lived cached files.

The deployment host should serve these content-addressed shard URLs with an immutable cache policy such as `Cache-Control: public, max-age=31536000, immutable`. A changed source, tool output, or glyph set produces a different URL; `fonts.css` and `fonts-manifest.json` point to the matching files.

The generated shards replace upstream Reserved Font Name identities with `Musubi CJK Fallback`, retain copyright and OFL metadata, ship the SIL Open Font License 1.1, and are validated before publication. A required build-time Chinese typography code point that is absent from the complete fallback fails generation rather than silently switching to an unrelated system face.