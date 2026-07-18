import { describe, expect, it } from 'vite-plus/test'
import { verifyPrebuiltFallbackCoverage } from './build-fonts.ts'

describe('checked-in fallback font bundle', () => {
  it('matches every declared cmap range without overlap', async () => {
    await expect(verifyPrebuiltFallbackCoverage()).resolves.toBeUndefined()
  }, 30_000)
})