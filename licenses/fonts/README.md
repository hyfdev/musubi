# Musubi Font Sources

Musubi does not commit upstream font binaries. The build downloads them into a private checksum-addressed user cache, verifies them, and writes only the public artifacts required by the current generated corpus.

- `Luo-Regular.woff2`: [`tw93/Luo`](https://github.com/tw93/Luo) commit `588c4f3dbe3a0e9b3b860ca62f61ca9b373909d1`, path `dist/Luo-Regular.woff2`, SHA-256 `661581c1210598a1b6950c34b160fe0318b4cdc122fea8aeed11691555336724`.
- `Musubi-CJK-Fallback.woff2`: generated from [`lxgw/LxgwWenKai-Screen`](https://github.com/lxgw/LxgwWenKai-Screen) release `v1.522`, asset `LXGWWenKaiScreen.ttf`, SHA-256 `cd1a6fa39c4ea42fd8f4e289945789b0e510cf7016435640f8893cdad9b220f3`.

The generated fallback contains only current-corpus Chinese typography code points absent from Luo. Its family, full, unique, preferred-family, and PostScript identities are rewritten to `Musubi CJK Fallback` identities so the modified font does not use the upstream Reserved Font Name. `fonts-manifest.json` records the exact coverage and artifact checksums for each generation.