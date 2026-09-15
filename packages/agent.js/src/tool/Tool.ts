import type { LlmToolSpec } from "../llm/Llm.ts"

export type ToolHandler = (
  args: Record<string, unknown>,
) => string | Promise<string>

export type Tool = {
  spec: LlmToolSpec
  handler: ToolHandler
}
