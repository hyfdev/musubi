import { rebuildPrebuiltFallback } from './build-fonts.ts'

rebuildPrebuiltFallback().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})