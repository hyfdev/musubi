import { clearTsangerFonts, setupTsangerFonts, TSANGER_FONT_SOURCES } from './tsanger-fonts.ts'

const args = process.argv.slice(2)
const soft = args.includes('--soft')
const clear = args.includes('--clear')
const help = args.includes('--help')
const unknown = args.filter((arg) => arg !== '--soft' && arg !== '--clear' && arg !== '--help')

if (help) {
  console.log(`Usage: vp run font:setup [-- --clear] [-- --soft]

Downloads and verifies the optional Tsanger JinKai W04/W05 source fonts into
this checkout's private .musubi cache. When a verified cache already exists,
downloads are skipped. Pipeline entry points (postinstall, check:build, dev)
invoke this with --soft so a download failure keeps Musubi CJK Fallback builds working.

Optional environment:
  MUSUBI_TSANGER_W04_URL / MUSUBI_TSANGER_W05_URL
    Paired HTTPS URLs used instead of the official download hosts. Files must still
    match the pinned size and SHA-256. Do not commit these values; set them only in
    the builder environment when mirroring the sources.
  MUSUBI_TSANGER_W04_PATH / MUSUBI_TSANGER_W05_PATH
    Paired local files for font:build (skips download when both are set for build).
  MUSUBI_TSANGER_CACHE_DIR
    Alternate cache directory for setup output.
  MUSUBI_TSANGER_SETUP=0
    Skip setup entirely (exit successfully). Useful for offline or fallback-only CI.

Options:
  --clear  Remove the cached Tsanger sources and return this checkout to fallback-only builds.
  --soft   On failure, print a warning and exit 0 so the rest of the pipeline can continue.
  --help   Show this help.`)
} else if (unknown.length > 0) {
  throw new Error(`Unknown font:setup argument: ${unknown.join(' ')}`)
} else if (clear) {
  const directory = await clearTsangerFonts()
  console.log(`Removed optional Tsanger JinKai sources from ${directory}.`)
  console.log('Future builds will use Musubi CJK Fallback unless explicit source paths are set.')
} else if (process.env.MUSUBI_TSANGER_SETUP?.trim() === '0') {
  console.log('Skipping font:setup because MUSUBI_TSANGER_SETUP=0.')
} else {
  console.log(
    'Tsanger JinKai is optional. The official terms allow personal non-commercial use; commercial use requires separate authorization.',
  )
  console.log('The font remains separately licensed from Musubi.')
  console.log(
    `W04 terms: ${TSANGER_FONT_SOURCES.w04.productUrl}\nW05 terms: ${TSANGER_FONT_SOURCES.w05.productUrl}`,
  )
  try {
    const installed = await setupTsangerFonts((message) => console.log(message))
    console.log(`Optional Tsanger JinKai sources are ready in ${installed.directory}.`)
    console.log('Future builds in this checkout will create W04/W05 subsets automatically.')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (soft) {
      console.warn(`font:setup failed; continuing with Musubi CJK Fallback only: ${message}`)
      process.exitCode = 0
    } else {
      console.error(message)
      process.exitCode = 1
    }
  }
}