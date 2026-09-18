import { z } from "zod"
import type { DeepSeekModelConfig } from "./DeepSeekModelConfig.ts"

const deepSeekModelConfigSchema = z.object({
  thinking: z
    .union([z.literal("enabled"), z.literal("disabled")])
    .default("enabled"),
  reasoningEffort: z
    .union([
      z.literal("none"),
      z.literal("low"),
      z.literal("high"),
      z.literal("max"),
    ])
    .default("high"),
})

export function parseDeepSeekModelConfig(
  name: string,
  text: string,
): DeepSeekModelConfig {
  const value = parseDeepSeekJson(text)
  const result = deepSeekModelConfigSchema.safeParse(value)
  if (!result.success) {
    throw new Error(
      `[parseDeepSeekModelConfig] invalid model config: ${result.error.message}`,
    )
  }

  return {
    name,
    ...result.data,
  }
}

function parseDeepSeekJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`[parseDeepSeekModelConfig] invalid JSON: ${message}`)
  }
}
