import { errorReport } from "@xieyuheng/std.js/error"
import type { Sign, ToolCall, ToolSign, UserSign } from "../model/Sign.ts"
import type { Agent } from "./Agent.ts"

export async function* agentRun(
  agent: Agent,
  input: string,
): AsyncGenerator<Sign> {
  const userSign: UserSign = { kind: "UserSign", content: input }
  agent.context.signs.push(userSign)

  let step = 0
  while (true) {
    if (step >= agent.config.maxSteps) {
      yield {
        kind: "ErrorSign",
        message: `[agentRun] max steps reached: ${agent.config.maxSteps}`,
      }
      return
    }

    step += 1

    let output
    try {
      output = await agent.model.interpret({
        context: agent.context,
        tools: agent.config.tools.map((tool) => tool.spec),
      })
    } catch (error) {
      yield {
        kind: "ErrorSign",
        message: `[agentRun] model interpret failed: ${errorReport(error)}`,
      }
      return
    }

    const assistantSign = output.sign
    agent.context.signs.push(assistantSign)
    yield assistantSign

    if (assistantSign.toolCalls.length === 0) {
      return
    }

    for (const toolCall of assistantSign.toolCalls) {
      const content = await toolCallRun(toolCall, agent)
      const toolSign: ToolSign = {
        kind: "ToolSign",
        toolCallId: toolCall.id,
        content,
      }
      agent.context.signs.push(toolSign)
      yield toolSign
    }
  }
}

async function toolCallRun(toolCall: ToolCall, agent: Agent): Promise<string> {
  const tool = agent.config.tools.find(
    (tool) => tool.spec.name === toolCall.name,
  )
  if (tool === undefined) {
    return `[agentRun] unknown tool: ${toolCall.name}`
  }

  try {
    const args = toolArgumentsParse(toolCall)
    return await tool.handler(agent, args)
  } catch (error) {
    return errorReport(error)
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
