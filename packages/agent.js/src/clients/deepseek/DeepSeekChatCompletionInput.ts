import type { DeepSeekMessage } from "./DeepSeekMessage.ts"
import type { DeepSeekTool } from "./DeepSeekTool.ts"

export type DeepSeekChatCompletionInput = {
  model: string
  messages: Array<DeepSeekMessage>
  tools: Array<DeepSeekTool>
  thinking: {
    type: "enabled" | "disabled"
  }
  reasoning_effort: "none" | "low" | "high" | "max"
}
