import { z } from "zod"
import type { DeepSeekProvider } from "./DeepSeekProvider.ts"

const deepSeekProviderSchema = z.object({
  baseUrl: z.string().min(1),
  key: z.string().min(1),
})

export function parseDeepSeekProvider(text: string): DeepSeekProvider {
  const value = parseDeepSeekJson(text)
  const result = deepSeekProviderSchema.safeParse(value)
  if (!result.success) {
    throw new Error(
      `[parseDeepSeekProvider] invalid provider: ${result.error.message}`,
    )
  }

  return result.data
}

function parseDeepSeekJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`[parseDeepSeekProvider] invalid JSON: ${message}`)
  }
}
