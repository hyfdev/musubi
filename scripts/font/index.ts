import { clearTsangerFonts, setupTsangerFonts, TSANGER_FONT_SOURCES } from './tsanger-fonts.ts'

const args = process.argv.slice(2)

if (args.includes('--help')) {
  console.log(`Usage: vp run font:setup [-- --clear]

Downloads and verifies the optional Tsanger JinKai W04/W05 source fonts into
this checkout's private .musubi cache. Normal builds never run this command
automatically and use Musubi's open-source fallback when the cache is absent.

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