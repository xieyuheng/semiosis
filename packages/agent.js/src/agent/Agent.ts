import type { Model, ModelMessage, ModelToolCall } from "../model/Model.ts"
import type { Tool } from "../tool/Tool.ts"
import type { AgentEnv } from "./AgentEnv.ts"

export type AgentState = {
  messages: Array<ModelMessage>
}

export type AgentOptions = {
  model: Model
  tools: Array<Tool>
  maxSteps: number
  env: AgentEnv
}

export type AgentEvent =
  | { type: "assistant_text"; text: string }
  | { type: "tool_call"; toolCall: ModelToolCall }
  | { type: "tool_result"; toolCallId: string; content: string }
  | { type: "error"; message: string }
  | { type: "done" }

export function makeAgentState(): AgentState {
  return { messages: [] }
}
