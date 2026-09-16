import { errorReport } from "@xieyuheng/std.js/error"
import type { Sign, ToolCall, ToolSign, UserSign } from "../model/Sign.ts"
import type { AgentOptions, AgentState } from "./Agent.ts"

export async function* agentRun(
  state: AgentState,
  input: string,
  options: AgentOptions,
): AsyncGenerator<Sign> {
  const userSign: UserSign = { kind: "UserSign", content: input }
  state.context.signs.push(userSign)

  let step = 0
  while (true) {
    if (step >= options.maxSteps) {
      yield {
        kind: "ErrorSign",
        message: `[agentRun] max steps reached: ${options.maxSteps}`,
      }
      return
    }

    step += 1

    let output
    try {
      output = await options.model.interpret({
        context: state.context,
        tools: options.tools.map((tool) => tool.spec),
      })
    } catch (error) {
      yield {
        kind: "ErrorSign",
        message: `[agentRun] model interpret failed: ${errorReport(error)}`,
      }
      return
    }

    const assistantSign = output.sign
    state.context.signs.push(assistantSign)
    yield assistantSign

    if (assistantSign.toolCalls.length === 0) {
      return
    }

    for (const toolCall of assistantSign.toolCalls) {
      const content = await toolCallRun(toolCall, options)
      const toolSign: ToolSign = {
        kind: "ToolSign",
        toolCallId: toolCall.id,
        content,
      }
      state.context.signs.push(toolSign)
      yield toolSign
    }
  }
}

async function toolCallRun(
  toolCall: ToolCall,
  options: AgentOptions,
): Promise<string> {
  const tool = options.tools.find((tool) => tool.spec.name === toolCall.name)
  if (tool === undefined) {
    return `[agentRun] unknown tool: ${toolCall.name}`
  }

  try {
    const args = toolArgumentsParse(toolCall)
    return await tool.handler(options.env, args)
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
