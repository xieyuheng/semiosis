import type { Agent } from "../agent/Agent.ts"

export type ToolSpec = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type ToolCall = {
  id: string
  name: string
  arguments: string
}

export type ToolHandler = (
  agent: Agent,
  args: Record<string, unknown>,
) => string | Promise<string>

export type Tool = {
  spec: ToolSpec
  handler: ToolHandler
}
