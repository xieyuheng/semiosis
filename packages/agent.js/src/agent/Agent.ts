import type { LlmChat, LlmMessage, LlmToolCall } from "../llm/Llm.ts"
import type { Tool } from "../tool/Tool.ts"

export type AgentState = {
  messages: Array<LlmMessage>
}

export type AgentOptions = {
  llmChat: LlmChat
  tools: Array<Tool>
  maxSteps: number
}

export type AgentEvent =
  | { type: "assistant_text"; text: string }
  | { type: "tool_call"; toolCall: LlmToolCall }
  | { type: "tool_result"; toolCallId: string; content: string }
  | { type: "error"; message: string }
  | { type: "done" }

export function makeAgentState(): AgentState {
  return { messages: [] }
}
