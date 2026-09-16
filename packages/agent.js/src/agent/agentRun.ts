import { errorReport } from "@xieyuheng/std.js/error"
import {
  ErrorSign,
  ToolSign,
  UserSign,
  isAssistantSign,
  isErrorSign,
  type Sign,
  type ToolCall,
} from "../model/Sign.ts"
import type { Agent } from "./Agent.ts"

export async function* agentRun(
  agent: Agent,
  input: string,
): AsyncGenerator<Sign> {
  const userSign = UserSign(input)
  agent.context.signs.push(userSign)

  let step = 0
  while (true) {
    if (step >= agent.config.maxSteps) {
      yield ErrorSign(`[agentRun] max steps reached: ${agent.config.maxSteps}`)
      return
    }

    step += 1

    const output = await agent.model.interpret({
      context: agent.context,
      tools: agent.config.tools.map((tool) => tool.spec),
    })

    const sign = output.sign

    if (isErrorSign(sign)) {
      yield sign
      return
    }

    if (!isAssistantSign(sign)) {
      yield ErrorSign(`[agentRun] unexpected model output sign: ${sign.kind}`)
      return
    }

    agent.context.signs.push(sign)
    yield sign

    if (sign.toolCalls.length === 0) {
      return
    }

    for (const toolCall of sign.toolCalls) {
      const content = await toolCallRun(toolCall, agent)
      const toolSign = ToolSign(toolCall.id, content)
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
