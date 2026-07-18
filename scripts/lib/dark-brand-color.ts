import {
  PAPER_HUE_REFERENCES,
  PAPER_KRIGING_INVERSE,
  PAPER_POINTS,
  PAPER_VARIOGRAM,
  type PaperHueReference,
} from './dark-brand-model.ts'

type Rgb = [number, number, number]

interface Lab {
  readonly L: number
  readonly a: number
  readonly b: number
}

interface Oklch {
  readonly L: number
  readonly C: number
  readonly H: number
}

interface Candidate {
  readonly rgb: Rgb
  readonly C: number
  readonly L: number
}

interface PaperTarget {
  readonly hex: string
  readonly rgb: Rgb
}

export interface DarkBrandColorDetails {
  readonly seedHex: string
  readonly paperTargetHex: string | null
  readonly preferredTargetHex: string
  readonly darkHex: string
  readonly modelInfluence: number
  readonly adaptation: 'preferred' | 'contrast-lifted'
  readonly surfaceContrasts: readonly {
    readonly background: string
    readonly ratio: number
  }[]
  readonly onColor: string
  readonly onColorContrast: number
}

/** The only brand-color input a Musubi owner changes. */
export const MUSUBI_BRAND_SEED = '#A64156'

/** Fixed backgrounds where the dark brand color is actually used as foreground text or a mark. */
export const MUSUBI_DARK_ACCENT_BACKGROUNDS = ['#141413', '#30302E', '#26364B'] as const

export const DARK_BRAND_ALGORITHM_VERSION = 2

const FOREGROUND_CONTRAST = 4.7
const ON_COLOR_CONTRAST = 4.5
const COMFORT_MODEL_FULL_CHROMA = 0.04
const SEARCH_STEPS = 4096
const ON_COLORS = ['#FFFFFF', '#141413'] as const

function normalizeHex(value: string): string {
  const trimmed = value.trim()
  const expanded = /^#?[0-9a-f]{3}$/i.test(trimmed)
    ? trimmed
        .replace('#', '')
        .split('')
        .map((character) => character + character)
        .join('')
    : trimmed.replace('#', '')

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    throw new Error(
      `Expected a three- or six-digit sRGB hex color, received ${JSON.stringify(value)}`,
    )
  }

  return `#${expanded.toUpperCase()}`
}

function hexToRgb(hex: string): Rgb {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
}

function rgbToHex([red, green, blue]: Rgb): string {
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(value: number): number {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
}

function rgbToLab(rgb: Rgb): Lab {
  const red = srgbToLinear(rgb[0] / 255)
  const green = srgbToLinear(rgb[1] / 255)
  const blue = srgbToLinear(rgb[2] / 255)
  const xyz: Rgb = [
    0.412453 * red + 0.35758 * green + 0.180423 * blue,
    0.212671 * red + 0.71516 * green + 0.072169 * blue,
    0.019334 * red + 0.119193 * green + 0.950227 * blue,
  ]
  const referenceWhite: Rgb = [0.95047, 1, 1.08883]
  const transformed = xyz.map((value, index) => {
    const ratio = value / referenceWhite[index]!
    return ratio > 0.008856 ? Math.cbrt(ratio) : 7.787 * ratio + 16 / 116
  })

  return {
    L: 116 * transformed[1]! - 16,
    a: 500 * (transformed[0]! - transformed[1]!),
    b: 200 * (transformed[1]! - transformed[2]!),
  }
}

function labToRgb({ L, a, b }: Lab): Rgb {
  const y = (L + 16) / 116
  const xyzRoot: Rgb = [a / 500 + y, y, Math.max(0, y - b / 200)]
  const referenceWhite: Rgb = [0.95047, 1, 1.08883]
  const xyz = xyzRoot.map((value, index) => {
    const linear = value > 0.2068966 ? value ** 3 : (value - 16 / 116) / 7.787
    return linear * referenceWhite[index]!
  })
  const linearRgb: Rgb = [
    3.2404813432005266 * xyz[0]! - 1.5371515162713183 * xyz[1]! - 0.49853632616888782 * xyz[2]!,
    -0.96925494999656825 * xyz[0]! + 1.8759900014898907 * xyz[1]! + 0.041555926558292829 * xyz[2]!,
    0.055646639135177166 * xyz[0]! - 0.20404133836651123 * xyz[1]! + 1.0573110696453443 * xyz[2]!,
  ]

  return linearRgb.map((channel) =>
    Math.max(0, Math.min(255, Math.floor(linearToSrgb(channel) * 255))),
  ) as Rgb
}

function paperVariogram(distance: number): number {
  const scaledRange = (PAPER_VARIOGRAM.range * 4) / 7
  return (
    PAPER_VARIOGRAM.partialSill * (1 - Math.exp(-(distance ** 2) / scaledRange ** 2)) +
    PAPER_VARIOGRAM.nugget
  )
}

function paperSurfaceLightness(a: number, b: number): number {
  const rightHandSide = PAPER_POINTS.map(
    ([pointA, pointB]) => -paperVariogram(Math.hypot(a - pointA, b - pointB)),
  ).concat(1)
  const weights = PAPER_KRIGING_INVERSE.map((row) =>
    row.reduce((sum, value, index) => sum + value * rightHandSide[index]!, 0),
  )

  return PAPER_POINTS.reduce((sum, point, index) => sum + weights[index]! * point[2], 0)
}

function unitVector(vector: readonly number[]): number[] {
  const length = Math.hypot(...vector)
  return length < 1e-9 ? vector.map(() => 0) : vector.map((value) => value / length)
}

function labHueAndChroma({ a, b }: Lab): { H: number; C: number } {
  return {
    H: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
    C: Math.hypot(a, b),
  }
}

function hueAngleDifference(first: number, second: number): number {
  const difference = Math.abs(first - second)
  return Math.min(difference, 360 - difference)
}

function handleHueWrap(first: number, second: number): [number, number] {
  if (Math.abs(first - second) <= 180) return [first, second]
  return first > second ? [first - 360, second] : [first, second - 360]
}

function interpolatePaperHue(reference: PaperHueReference, targetChroma: number): number {
  const { chroma, hue, refH } = reference
  if (targetChroma < chroma[0]) {
    return refH + (targetChroma / chroma[0]) * (hue[0] - refH)
  }

  const lastIndex = chroma.length - 1
  if (targetChroma > chroma[lastIndex]!) {
    const slope =
      (hue[lastIndex]! - hue[lastIndex - 1]!) / (chroma[lastIndex]! - chroma[lastIndex - 1]!)
    return hue[lastIndex]! + slope * (targetChroma - chroma[lastIndex]!)
  }

  for (let index = 0; index < lastIndex; index += 1) {
    if (chroma[index]! <= targetChroma && targetChroma <= chroma[index + 1]!) {
      const [firstHue, secondHue] = handleHueWrap(hue[index]!, hue[index + 1]!)
      const ratio = (targetChroma - chroma[index]!) / (chroma[index + 1]! - chroma[index]!)
      return firstHue + ratio * (secondHue - firstHue)
    }
  }

  return refH
}

function applyPaperHueCorrection(source: Lab, adjusted: Lab): Lab {
  const sourceTone = labHueAndChroma(source)
  const targetTone = labHueAndChroma(adjusted)
  let closestIndex = 0
  let closestDifference = Number.POSITIVE_INFINITY

  PAPER_HUE_REFERENCES.forEach((reference, index) => {
    const difference = hueAngleDifference(sourceTone.H, reference.refH)
    if (difference < closestDifference) {
      closestDifference = difference
      closestIndex = index
    }
  })

  const closest = PAPER_HUE_REFERENCES[closestIndex]!
  const sourceIsBelow = closest.hue.every((hue) => {
    const [sourceHue, referenceHue] = handleHueWrap(sourceTone.H, hue)
    return sourceHue < referenceHue
  })
  const sourceIsAbove = closest.hue.every((hue) => {
    const [sourceHue, referenceHue] = handleHueWrap(sourceTone.H, hue)
    return sourceHue > referenceHue
  })
  let references: readonly PaperHueReference[]

  if (sourceIsAbove) {
    references = [closest, PAPER_HUE_REFERENCES[(closestIndex + 1) % PAPER_HUE_REFERENCES.length]!]
  } else if (sourceIsBelow) {
    references = [
      PAPER_HUE_REFERENCES[
        (closestIndex - 1 + PAPER_HUE_REFERENCES.length) % PAPER_HUE_REFERENCES.length
      ]!,
      closest,
    ]
  } else {
    references = [closest]
  }

  const corrections = references.map((reference) => {
    const sourceReferenceHue = interpolatePaperHue(reference, sourceTone.C)
    const targetReferenceHue = interpolatePaperHue(reference, targetTone.C)
    return {
      delta: targetReferenceHue - sourceReferenceHue,
      distance: Math.abs(sourceTone.H - sourceReferenceHue),
    }
  })
  let deltaHue = corrections[0]!.delta

  if (corrections.length === 2) {
    const totalDistance = corrections[0]!.distance + corrections[1]!.distance
    if (totalDistance !== 0) {
      deltaHue =
        (corrections[0]!.delta * corrections[1]!.distance +
          corrections[1]!.delta * corrections[0]!.distance) /
        totalDistance
    }
  }

  const finalHue = (targetTone.H + deltaHue + 360) % 360
  const radians = (finalHue * Math.PI) / 180
  return {
    L: adjusted.L,
    a: targetTone.C * Math.cos(radians),
    b: targetTone.C * Math.sin(radians),
  }
}

function derivePaperTarget(seedHex: string): PaperTarget {
  const source = rgbToLab(hexToRgb(seedHex))
  const curve = Array.from({ length: 100 }, (_, index) => {
    const factor = (index * 1.5) / 99
    const a = factor * source.a
    const b = factor * source.b
    return [a, b, paperSurfaceLightness(a, b)] as const
  })
  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  curve.forEach((point, index) => {
    const distance = Math.hypot(point[0] - source.a, point[1] - source.b, point[2] - source.L)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  })

  let curveLength = 0
  for (let index = 0; index < closestIndex; index += 1) {
    curveLength += Math.hypot(
      curve[index + 1]![0] - curve[index]![0],
      curve[index + 1]![1] - curve[index]![1],
      curve[index + 1]![2] - curve[index]![2],
    )
  }

  const closest = curve[closestIndex]!
  const previous = closestIndex === 0 ? curve[0]! : curve[closestIndex - 1]!
  const next = closestIndex === 0 ? curve[1]! : curve[closestIndex]!
  const tangent = [next[0] - previous[0], next[1] - previous[1], next[2] - previous[2]]
  const towardCurve = [closest[0] - source.a, closest[1] - source.b, closest[2] - source.L]
  const signedDistance = source.L >= closest[2] ? closestDistance : -closestDistance
  const tangentProjection = -0.002602 * curveLength ** 2 + 0.05563 * curveLength
  const curveProjection = 0.000947 * signedDistance ** 2 - 0.591832 * signedDistance
  const initialChroma = Math.hypot(source.a, source.b)
  const movedChroma = Math.hypot(source.a + tangent[0]!, source.b + tangent[1]!)
  const tangentSign = movedChroma < initialChroma ? -1 : 1
  const tangentDirection = unitVector(tangent).map(
    (value) => value * tangentProjection * tangentSign,
  )
  const curveDirectionSign = source.L >= closest[2] ? -1 : 1
  const curveDirection = unitVector(towardCurve).map(
    (value) => value * curveProjection * curveDirectionSign,
  )
  const adjusted: Lab = {
    L: source.L + tangentDirection[2]! + curveDirection[2]!,
    a: source.a + tangentDirection[0]! + curveDirection[0]!,
    b: source.b + tangentDirection[1]! + curveDirection[1]!,
  }
  const hueCorrected = applyPaperHueCorrection(source, adjusted)
  const rgb = labToRgb(hueCorrected)

  return { hex: rgbToHex(rgb), rgb }
}

function rgbToOklch(rgb: Rgb): Oklch {
  const red = srgbToLinear(rgb[0] / 255)
  const green = srgbToLinear(rgb[1] / 255)
  const blue = srgbToLinear(rgb[2] / 255)
  const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue
  const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue
  const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue
  const lp = Math.cbrt(l)
  const mp = Math.cbrt(m)
  const sp = Math.cbrt(s)
  const L = 0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp
  const a = 1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp
  const b = 0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp
  const rawC = Math.hypot(a, b)
  const C = rawC < 1e-7 ? 0 : rawC

  return {
    L,
    C,
    H: C === 0 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
  }
}

function oklchToLinearRgb({ L, C, H }: Oklch): Rgb {
  const angle = (H * Math.PI) / 180
  const a = C * Math.cos(angle)
  const b = C * Math.sin(angle)
  const lp = L + 0.3963377774 * a + 0.2158037573 * b
  const mp = L - 0.1055613458 * a - 0.0638541728 * b
  const sp = L - 0.0894841775 * a - 1.291485548 * b
  const l = lp ** 3
  const m = mp ** 3
  const s = sp ** 3

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

function isInSrgbGamut(rgb: Rgb): boolean {
  return rgb.every((channel) => channel >= -1e-9 && channel <= 1 + 1e-9)
}

function maxSrgbChroma(L: number, targetC: number, H: number): number {
  if (targetC === 0 || isInSrgbGamut(oklchToLinearRgb({ L, C: targetC, H }))) {
    return targetC
  }

  let low = 0
  let high = targetC
  for (let index = 0; index < 40; index += 1) {
    const middle = (low + high) / 2
    if (isInSrgbGamut(oklchToLinearRgb({ L, C: middle, H }))) low = middle
    else high = middle
  }
  return low
}

function candidateAtOklch({ L, C, H }: Oklch): Candidate {
  const fittedC = maxSrgbChroma(L, C, H)
  const linearRgb = oklchToLinearRgb({ L, C: fittedC, H })
  const rgb = linearRgb.map((channel) =>
    Math.max(0, Math.min(255, Math.round(linearToSrgb(channel) * 255))),
  ) as Rgb
  return { rgb, C: fittedC, L }
}

function relativeLuminance(rgb: Rgb): number {
  const red = srgbToLinear(rgb[0] / 255)
  const green = srgbToLinear(rgb[1] / 255)
  const blue = srgbToLinear(rgb[2] / 255)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrastRatio(firstHex: string, secondHex: string): number {
  const firstLuminance = relativeLuminance(hexToRgb(normalizeHex(firstHex)))
  const secondLuminance = relativeLuminance(hexToRgb(normalizeHex(secondHex)))
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  )
}

function surfaceContrasts(rgb: Rgb): number[] {
  return MUSUBI_DARK_ACCENT_BACKGROUNDS.map((background) =>
    contrastRatio(rgbToHex(rgb), background),
  )
}

function chooseOnColor(accentHex: string): { hex: string; contrast: number } {
  return ON_COLORS.map((hex) => ({ hex, contrast: contrastRatio(hex, accentHex) })).sort(
    (first, second) => second.contrast - first.contrast,
  )[0]!
}

function candidatePasses(candidate: Candidate): boolean {
  const hex = rgbToHex(candidate.rgb)
  return (
    surfaceContrasts(candidate.rgb).every((value) => value >= FOREGROUND_CONTRAST) &&
    chooseOnColor(hex).contrast >= ON_COLOR_CONTRAST
  )
}

function smoothstep(value: number): number {
  const clamped = Math.max(0, Math.min(1, value))
  return clamped * clamped * (3 - 2 * clamped)
}

function interpolateHue(first: number, second: number, amount: number): number {
  const shortestTurn = ((second - first + 540) % 360) - 180
  return (first + shortestTurn * amount + 360) % 360
}

function oklabPoint({ L, C, H }: Oklch): Rgb {
  const radians = (H * Math.PI) / 180
  return [L, C * Math.cos(radians), C * Math.sin(radians)]
}

function oklabDistanceSquared(candidate: Candidate, desiredPoint: Rgb): number {
  const candidatePoint = oklabPoint(rgbToOklch(candidate.rgb))
  return candidatePoint.reduce((sum, value, index) => sum + (value - desiredPoint[index]!) ** 2, 0)
}

export function derivePaperDarkTarget(seed: string): string {
  return derivePaperTarget(normalizeHex(seed)).hex
}

export function inspectDarkBrandColor(seed: string): DarkBrandColorDetails {
  const seedHex = normalizeHex(seed)
  const seedRgb = hexToRgb(seedHex)
  const seedOklch = rgbToOklch(seedRgb)
  const modelInfluence = smoothstep(seedOklch.C / COMFORT_MODEL_FULL_CHROMA)
  const paperTarget = modelInfluence > 0 ? derivePaperTarget(seedHex) : null
  const target = paperTarget ? rgbToOklch(paperTarget.rgb) : seedOklch
  const desired: Oklch = {
    L: seedOklch.L + (target.L - seedOklch.L) * modelInfluence,
    C: seedOklch.C + (target.C - seedOklch.C) * modelInfluence,
    H: interpolateHue(seedOklch.H, target.H, modelInfluence),
  }
  const preferred = candidateAtOklch(desired)
  const preferredTargetHex = rgbToHex(preferred.rgb)

  let failingLightness = 0
  let passingLightness = 1
  for (let index = 0; index < 52; index += 1) {
    const middle = (failingLightness + passingLightness) / 2
    const candidate = candidateAtOklch({ L: middle, C: desired.C, H: desired.H })
    if (candidatePasses(candidate)) passingLightness = middle
    else failingLightness = middle
  }

  const minimumPassing = candidateAtOklch({
    L: passingLightness,
    C: desired.C,
    H: desired.H,
  })
  const desiredPoint = oklabPoint(desired)
  let bestCandidate: Candidate | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  const consider = (candidate: Candidate): void => {
    if (!candidatePasses(candidate)) return
    const distance = oklabDistanceSquared(candidate, desiredPoint)
    const candidateHex = rgbToHex(candidate.rgb)
    const bestHex = bestCandidate ? rgbToHex(bestCandidate.rgb) : ''
    if (
      distance < bestDistance - 1e-12 ||
      (Math.abs(distance - bestDistance) <= 1e-12 && candidateHex < bestHex)
    ) {
      bestCandidate = candidate
      bestDistance = distance
    }
  }

  consider(preferred)
  consider(minimumPassing)
  for (let index = 0; index <= SEARCH_STEPS; index += 1) {
    consider(candidateAtOklch({ L: index / SEARCH_STEPS, C: desired.C, H: desired.H }))
  }

  if (!bestCandidate) {
    throw new Error(`No accessible dark brand color could be generated for ${seedHex}`)
  }

  const darkHex = rgbToHex(bestCandidate.rgb)
  const onColor = chooseOnColor(darkHex)
  return {
    seedHex,
    paperTargetHex: paperTarget?.hex ?? null,
    preferredTargetHex,
    darkHex,
    modelInfluence,
    adaptation: darkHex === preferredTargetHex ? 'preferred' : 'contrast-lifted',
    surfaceContrasts: MUSUBI_DARK_ACCENT_BACKGROUNDS.map((background) => ({
      background,
      ratio: contrastRatio(darkHex, background),
    })),
    onColor: onColor.hex,
    onColorContrast: onColor.contrast,
  }
}

/**
 * Derive Musubi's single dark-mode brand color from its light-mode brand seed.
 * The approved dark backgrounds are fixed project context and are deliberately not caller inputs.
 */
export function deriveDarkBrandColor(seed: string): string {
  return inspectDarkBrandColor(seed).darkHex
}

export function oklabDistanceBetweenHex(first: string, second: string): number {
  const firstPoint = oklabPoint(rgbToOklch(hexToRgb(normalizeHex(first))))
  const secondPoint = oklabPoint(rgbToOklch(hexToRgb(normalizeHex(second))))
  return Math.hypot(
    firstPoint[0] - secondPoint[0],
    firstPoint[1] - secondPoint[1],
    firstPoint[2] - secondPoint[2],
  )
}