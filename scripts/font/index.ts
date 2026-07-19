import { clearTsangerFonts, setupTsangerFonts, TSANGER_FONT_SOURCES } from './tsanger-fonts.ts'

const args = process.argv.slice(2)

if (args.includes('--help')) {
  console.log(`Usage: vp run font:setup [-- --clear]

Downloads and verifies the optional Tsanger JinKai W04/W05 source fonts into
this checkout's private .musubi cache. Normal builds never run this command
automatically and use Musubi's open-source fallback when the cache is absent.

Optional environment:
  MUSUBI_TSANGER_W04_URL / MUSUBI_TSANGER_W05_URL
    Paired HTTPS URLs used instead of the official download hosts. Files must still
    match the pinned size and SHA-256. Do not commit these values; set them only in
    the builder environment when mirroring the sources.
  MUSUBI_TSANGER_W04_PATH / MUSUBI_TSANGER_W05_PATH
    Paired local files for font:build (skips download when both are set for build).
  MUSUBI_TSANGER_CACHE_DIR
    Alternate cache directory for setup output.

Options:
  --clear  Remove the cached Tsanger sources and return this checkout to fallback-only builds.
  --help   Show this help.`)
} else if (args.includes('--clear')) {
  const directory = await clearTsangerFonts()
  console.log(`Removed optional Tsanger JinKai sources from ${directory}.`)
  console.log('Future builds will use Musubi CJK Fallback unless explicit source paths are set.')
} else if (args.length > 0) {
  throw new Error(`Unknown font:setup argument: ${args.join(' ')}`)
} else {
  console.log(
    'Tsanger JinKai is optional. The official terms allow personal non-commercial use; commercial use requires separate authorization.',
  )
  console.log('The font remains separately licensed from Musubi.')
  console.log(
    `W04 terms: ${TSANGER_FONT_SOURCES.w04.productUrl}\nW05 terms: ${TSANGER_FONT_SOURCES.w05.productUrl}`,
  )
  const installed = await setupTsangerFonts((message) => console.log(message))
  console.log(`Optional Tsanger JinKai sources are ready in ${installed.directory}.`)
  console.log('Future builds in this checkout will create W04/W05 subsets automatically.')
}