import { z } from "zod"
import type { DeepSeekChatCompletionOutput } from "./DeepSeekChatCompletionOutput.ts"

const deepSeekToolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: z.object({
    name: z.string(),
    arguments: z.string(),
  }),
})

const deepSeekMessageSchema = z.object({
  role: z.union([
    z.literal("system"),
    z.literal("user"),
    z.literal("assistant"),
    z.literal("tool"),
  ]),
  content: z.string().nullable().optional(),
  reasoning_content: z.string().nullable().optional(),
  tool_calls: z.array(deepSeekToolCallSchema).nullable().optional(),
  tool_call_id: z.string().optional(),
})

const deepSeekChatCompletionOutputSchema = z.object({
  choices: z.array(
    z.object({
      message: deepSeekMessageSchema,
    }),
  ),
})

export function parseDeepSeekChatCompletionOutput(
  text: string,
): DeepSeekChatCompletionOutput {
  const value = parseDeepSeekJson(text)
  const result = deepSeekChatCompletionOutputSchema.safeParse(value)
  if (!result.success) {
    throw new Error(
      `[parseDeepSeekChatCompletionOutput] invalid output: ${result.error.message}`,
    )
  }

  return result.data
}

function parseDeepSeekJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[parseDeepSeekChatCompletionOutput] invalid JSON: ${message}`,
    )
  }
}
