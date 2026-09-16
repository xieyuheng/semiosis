import { errorReport } from "@xieyuheng/std.js/error"
import type { Agent } from "../agent/Agent.ts"
import { ToolSign, type Sign } from "../sign/index.ts"
import type { ToolCall } from "./Tool.ts"

export async function toolCallRun(
  toolCall: ToolCall,
  agent: Agent,
): Promise<Sign> {
  const tool = agent.config.tools.find(
    (tool) => tool.spec.name === toolCall.name,
  )
  if (tool === undefined) {
    return ToolSign(toolCall.id, `[agentRun] unknown tool: ${toolCall.name}`)
  }

  try {
    const args = toolArgumentsParse(toolCall)
    const content = await tool.handler(agent, args)
    return ToolSign(toolCall.id, content)
  } catch (error) {
    return ToolSign(toolCall.id, errorReport(error))
  }
}

function toolArgumentsParse(toolCall: ToolCall): Record<string, unknown> {
  let value: unknown
  try {
    value = JSON.parse(toolCall.arguments)
  } catch (error) {
    throw new Error(
      `[agentRun] invalid arguments for tool ${toolCall.name}: ${errorReport(error)}`,
    )
  }

  if (typeof value !== "object" || value === null || value instanceof Array) {
    throw new Error(
      `[agentRun] arguments for tool ${toolCall.name} must be a JSON object`,
    )
  }

  return value as Record<string, unknown>
}
