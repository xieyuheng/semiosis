import { errorReport } from "@xieyuheng/std.js/error"
import type { ModelMessage, ModelToolCall } from "../model/Model.ts"
import type { AgentEvent, AgentOptions, AgentState } from "./Agent.ts"

export async function* agentRun(
  state: AgentState,
  input: string,
  options: AgentOptions,
): AsyncGenerator<AgentEvent> {
  state.messages.push({ role: "user", content: input })

  let step = 0
  while (true) {
    if (step >= options.maxSteps) {
      yield {
        type: "error",
        message: `[agentRun] max steps reached: ${options.maxSteps}`,
      }
      yield { type: "done" }
      return
    }

    step += 1
    const response = await options.model.interpret({
      messages: state.messages,
      tools: options.tools.map((tool) => tool.spec),
    })

    const assistant = response.message
    state.messages.push(assistant)

    if (assistant.content !== "") {
      yield { type: "assistant_text", text: assistant.content }
    }

    const toolCalls = assistant.toolCalls
    if (toolCalls.length === 0) {
      yield { type: "done" }
      return
    }

    for (const toolCall of toolCalls) {
      yield { type: "tool_call", toolCall }

      const content = await toolCallRun(toolCall, options)
      state.messages.push({
        role: "tool",
        toolCallId: toolCall.id,
        content,
      })
      yield { type: "tool_result", toolCallId: toolCall.id, content }
    }
  }
}

async function toolCallRun(
  toolCall: ModelToolCall,
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

function toolArgumentsParse(toolCall: ModelToolCall): Record<string, unknown> {
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
