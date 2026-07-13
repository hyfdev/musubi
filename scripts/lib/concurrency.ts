export async function mapConcurrent<Input, Output>(
  inputs: readonly Input[],
  limit: number,
  mapper: (input: Input, index: number) => Promise<Output>,
): Promise<Output[]> {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('Concurrency limit must be a positive integer')
  }

  const results = Array.from<Output | undefined>({ length: inputs.length })
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < inputs.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(inputs[index]!, index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, inputs.length) }, () => worker()))
  return results as Output[]
}