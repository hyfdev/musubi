import assert from 'node:assert/strict'

import {
  MUSUBI_BRAND_SEED,
  deriveDarkBrandColor,
  derivePaperDarkTarget,
  inspectDarkBrandColor,
  oklabDistanceBetweenHex,
} from './lib/dark-brand-color.ts'

const PAPER_REFERENCE_VECTORS = [
  ['#1B365D', '#435F93'],
  ['#8B1E3F', '#9B3550'],
  ['#FF0000', '#BC0019'],
  ['#F59E0B', '#D2891C'],
  ['#FFD400', '#D8B522'],
  ['#84CC16', '#84C13D'],
  ['#00C2FF', '#00A8DC'],
  ['#0000FF', '#0032C3'],
  ['#A78BFA', '#8473CD'],
  ['#111111', '#646464'],
] as const

const GENERATED_REFERENCE_VECTORS = [
  ['#1B365D', '#82A1D9'],
  ['#8B1E3F', '#ED7F96'],
  ['#FF0000', '#FF766D'],
  ['#F59E0B', '#DA9128'],
  ['#FFD400', '#D8B522'],
  ['#84CC16', '#84C13D'],
  ['#00C2FF', '#12ADE1'],
  ['#0000FF', '#709FFF'],
  ['#A78BFA', '#A494F1'],
  ['#111111', '#A1A1A1'],
] as const

const HEX_COLOR = /^#[0-9A-F]{6}$/
const FOREGROUND_CONTRAST = 4.7
const ON_COLOR_CONTRAST = 4.5
const MAX_ADJACENT_OKLAB_DISTANCE = 0.01
const quick = process.argv.includes('--quick')

for (const [seed, expected] of PAPER_REFERENCE_VECTORS) {
  assert.equal(
    derivePaperDarkTarget(seed),
    expected,
    `The vendored paper model drifted for ${seed}`,
  )
}

for (const [seed, expected] of GENERATED_REFERENCE_VECTORS) {
  assert.equal(deriveDarkBrandColor(seed), expected, `The generated dark color drifted for ${seed}`)
}

assert.match(MUSUBI_BRAND_SEED, HEX_COLOR)
assert.match(deriveDarkBrandColor(MUSUBI_BRAND_SEED), HEX_COLOR)
assert.equal(deriveDarkBrandColor('#abc'), deriveDarkBrandColor('#AABBCC'))
assert.throws(() => deriveDarkBrandColor('blue'), /Expected a three- or six-digit sRGB hex color/)

const levels = [0, 51, 102, 153, 204, 255]
let cubeColorsChecked = 0
if (!quick) {
  for (const red of levels) {
    for (const green of levels) {
      for (const blue of levels) {
        const seed = `#${[red, green, blue]
          .map((channel) => channel.toString(16).padStart(2, '0'))
          .join('')}`
        const result = inspectDarkBrandColor(seed)
        assert.match(result.darkHex, HEX_COLOR)
        assert.ok(
          result.surfaceContrasts.every(({ ratio }) => ratio >= FOREGROUND_CONTRAST),
          `${seed} produced ${result.darkHex}, which fails a dark background`,
        )
        assert.ok(
          result.onColorContrast >= ON_COLOR_CONTRAST,
          `${seed} produced ${result.darkHex}, which fails on-color contrast`,
        )
        cubeColorsChecked += 1
      }
    }
  }
}

let randomState = 0x12345678
const random = (): number => {
  randomState = (1664525 * randomState + 1013904223) >>> 0
  return randomState / 2 ** 32
}
const toHex = (rgb: readonly number[]): string =>
  `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`

let adjacentPairsChecked = 0
if (!quick) {
  for (let index = 0; index < 32; index += 1) {
    const rgb = [Math.floor(random() * 255), Math.floor(random() * 255), Math.floor(random() * 255)]
    const neighbor = [...rgb]
    neighbor[index % 3]! += 1
    const seed = toHex(rgb)
    const adjacentSeed = toHex(neighbor)
    const output = deriveDarkBrandColor(seed)
    const adjacentOutput = deriveDarkBrandColor(adjacentSeed)
    const distance = oklabDistanceBetweenHex(output, adjacentOutput)
    assert.ok(
      distance <= MAX_ADJACENT_OKLAB_DISTANCE,
      `Adjacent inputs ${seed} and ${adjacentSeed} jumped from ${output} to ${adjacentOutput}`,
    )
    adjacentPairsChecked += 1
  }

  for (const [first, second] of [['#8391FF', '#8491FF']] as const) {
    const firstOutput = deriveDarkBrandColor(first)
    const secondOutput = deriveDarkBrandColor(second)
    assert.ok(
      oklabDistanceBetweenHex(firstOutput, secondOutput) <= MAX_ADJACENT_OKLAB_DISTANCE,
      `Known adjacent pair ${first} and ${second} is discontinuous`,
    )
    adjacentPairsChecked += 1
  }
}

console.log(
  `Verified dark brand algorithm${quick ? ' (quick)' : ''}: ${PAPER_REFERENCE_VECTORS.length} paper vectors, ${GENERATED_REFERENCE_VECTORS.length} generated vectors, ${cubeColorsChecked} color-cube inputs, and ${adjacentPairsChecked} adjacent pairs.`,
)