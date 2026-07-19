import { clearTsangerFonts, setupTsangerFonts, TSANGER_FONT_SOURCES } from './tsanger-fonts.ts'

const args = process.argv.slice(2).filter((arg) => arg !== '--')
const clear = args.includes('--clear')
const help = args.includes('--help')
const unknown = args.filter((arg) => arg !== '--clear' && arg !== '--help')

if (help) {
  console.log(`Usage: vp run font:setup [-- --clear]

Downloads and verifies the Tsanger JinKai W04/W05 source fonts into this
checkout's private .musubi cache. When a verified cache already exists,
downloads are skipped. Default order is jsDelivr then tsanger.cn. Download
or verification failure exits non-zero.

Optional environment:
  MUSUBI_TSANGER_W04_URL / MUSUBI_TSANGER_W05_URL
    Paired HTTPS URLs that replace the default download order entirely. Files must
    still match the pinned size and SHA-256. Do not commit these values.
  MUSUBI_TSANGER_W04_PATH / MUSUBI_TSANGER_W05_PATH
    Paired local files for font:build (skips download when both are set for build).
  MUSUBI_TSANGER_CACHE_DIR
    Alternate cache directory for setup output.
  MUSUBI_TSANGER_SETUP=0
    Skip the setup download attempt (exit successfully). Does not clear an existing
    verified cache; pair with --clear when this checkout must not use Tsanger sources.

Options:
  --clear  Remove the cached Tsanger sources and return this checkout to fallback-only builds.
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
    'Tsanger JinKai: personal non-commercial use only; commercial use needs authorization from tsanger.cn.',
  )
  console.log('The font remains separately licensed from Musubi.')
  console.log(
    `W04 terms: ${TSANGER_FONT_SOURCES.w04.productUrl}\nW05 terms: ${TSANGER_FONT_SOURCES.w05.productUrl}`,
  )
  try {
    const installed = await setupTsangerFonts((message) => console.log(message))
    console.log(`Tsanger JinKai sources are ready in ${installed.directory}.`)
    console.log('font:build will create W04/W05 subsets from this cache when present.')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`font:setup failed: ${message}`)
    console.error(
      'Fix network/mirror access, or set MUSUBI_TSANGER_W04_URL and MUSUBI_TSANGER_W05_URL to reachable HTTPS copies of the pinned files. To skip the download attempt, set MUSUBI_TSANGER_SETUP=0 (clear the cache with "vp run font:setup -- --clear" if an existing pair must not be used). Local MUSUBI_TSANGER_W04_PATH/W05_PATH files are for font:build only and do not replace font:setup.',
    )
    process.exitCode = 1
  }
}