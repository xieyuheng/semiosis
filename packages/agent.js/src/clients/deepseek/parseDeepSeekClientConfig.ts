import { z } from "zod"
import type { DeepSeekClientConfig } from "./DeepSeekClientConfig.ts"

const deepSeekClientConfigSchema = z.object({
  baseUrl: z.string().min(1),
  key: z.string().min(1),
})

export function parseDeepSeekClientConfig(text: string): DeepSeekClientConfig {
  const value = parseDeepSeekJson(text)
  const result = deepSeekClientConfigSchema.safeParse(value)
  if (!result.success) {
    throw new Error(
      `[parseDeepSeekClientConfig] invalid client config: ${result.error.message}`,
    )
  }

  return result.data
}

function parseDeepSeekJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`[parseDeepSeekClientConfig] invalid JSON: ${message}`)
  }
}
