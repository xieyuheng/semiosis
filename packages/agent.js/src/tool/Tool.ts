import type { Agent } from "../agent/Agent.ts"
import type { ModelToolSpec } from "../model/Model.ts"

export type ToolHandler = (
  agent: Agent,
  args: Record<string, unknown>,
) => string | Promise<string>

export type Tool = {
  spec: ModelToolSpec
  handler: ToolHandler
}
