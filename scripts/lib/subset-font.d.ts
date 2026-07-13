declare module 'subset-font' {
  interface SubsetFontOptions {
    targetFormat?: 'truetype' | 'woff' | 'woff2'
    preserveNameIds?: number[]
    noLayoutClosure?: boolean
  }

  function subsetFont(
    originalFont: Uint8Array | ArrayBuffer,
    text: string,
    options?: SubsetFontOptions,
  ): Promise<Uint8Array>

  export default subsetFont
}