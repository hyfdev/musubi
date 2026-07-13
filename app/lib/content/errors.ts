import type { MusubiContentDiagnostic, MusubiContentErrorCode, SourcePosition } from './types.ts'

export interface MusubiContentErrorOptions {
  readonly pageLabel: string
  readonly code: MusubiContentErrorCode
  readonly message: string
  readonly position?: SourcePosition
  readonly cause?: unknown
}

export class MusubiContentError extends Error {
  readonly pageLabel: string
  readonly code: MusubiContentErrorCode
  readonly position?: SourcePosition

  constructor(options: MusubiContentErrorOptions) {
    const location = options.position
      ? ` at ${options.position.start.line}:${options.position.start.column}`
      : ''
    super(`[Musubi content ${options.pageLabel}] ${options.message}${location}`, {
      cause: options.cause,
    })
    this.name = 'MusubiContentError'
    this.pageLabel = options.pageLabel
    this.code = options.code
    this.position = options.position
  }

  toDiagnostic(): MusubiContentDiagnostic {
    return {
      code: this.code,
      pageLabel: this.pageLabel,
      message: this.message,
      position: this.position,
    }
  }
}

export function contentError(options: MusubiContentErrorOptions): never {
  throw new MusubiContentError(options)
}