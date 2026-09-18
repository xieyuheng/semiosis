import type { DeepSeekToolCall } from "./DeepSeekToolCall.ts"

export type DeepSeekMessage = {
  role: "system" | "user" | "assistant" | "tool"
  content?: string | null
  reasoning_content?: string | null
  tool_calls?: Array<DeepSeekToolCall> | null
  tool_call_id?: string
}
