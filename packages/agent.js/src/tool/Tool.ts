import type { AgentEnv } from "../agent/AgentEnv.ts"
import type { ModelToolSpec } from "../model/Model.ts"

export type ToolHandler = (
  env: AgentEnv,
  args: Record<string, unknown>,
) => string | Promise<string>

export type Tool = {
  spec: ModelToolSpec
  handler: ToolHandler
}
