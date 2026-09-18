import type {
  DeepSeekChatCompletionInput,
  DeepSeekClient,
  DeepSeekMessage,
  DeepSeekTool,
} from "../../clients/deepseek/index.ts"
import type { ModelInput, ModelOutput } from "../../model/index.ts"
import { AssistantSign, type Sign } from "../../sign/index.ts"
import type { ToolCall, ToolSpec } from "../../tool/index.ts"
import type { DeepSeekModelConfig } from "./DeepSeekModelConfig.ts"

export async function deepSeekInterpret(
  client: DeepSeekClient,
  config: DeepSeekModelConfig,
  input: ModelInput,
): Promise<ModelOutput> {
  const request: DeepSeekChatCompletionInput = {
    model: config.name,
    messages: input.context.signs.map(makeDeepSeekMessage),
    tools: input.tools.map(makeDeepSeekTool),
    thinking: {
      type: config.thinking,
    },
    reasoning_effort:
      config.thinking === "enabled" ? config.reasoningEffort : "none",
  }

  const output = await client.chatCompletion(request)
  const message = output.choices?.[0]?.message

  if (message === undefined) {
    throw new Error("[deepSeekInterpret] output.choices[0].message is missing")
  }

  return {
    sign: makeAssistantSign(message),
  }
}

function makeDeepSeekMessage(sign: Sign): DeepSeekMessage {
  switch (sign.kind) {
    case "SystemSign":
      return { role: "system", content: sign.content }
    case "UserSign":
      return { role: "user", content: sign.content }
    case "AssistantSign": {
      const message: DeepSeekMessage = {
        role: "assistant",
        content: sign.content,
      }

      if (sign.reasoning !== "") {
        message.reasoning_content = sign.reasoning
      }

      if (sign.toolCalls.length !== 0) {
        message.tool_calls = sign.toolCalls.map(makeDeepSeekToolCall)
      }

      return message
    }
    case "ToolSign":
      return {
        role: "tool",
        tool_call_id: sign.toolCallId,
        content: sign.content,
      }
    case "ErrorSign":
      throw new Error("[deepSeekInterpret] cannot send ErrorSign")
  }
}

function makeDeepSeekTool(tool: ToolSpec): DeepSeekTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }
}

function makeDeepSeekToolCall(toolCall: ToolCall) {
  return {
    id: toolCall.id,
    type: "function" as const,
    function: {
      name: toolCall.name,
      arguments: toolCall.arguments,
    },
  }
}

function makeAssistantSign(
  message: DeepSeekMessage,
): ReturnType<typeof AssistantSign> {
  const toolCalls =
    message.tool_calls?.map((toolCall) => ({
      id: toolCall.id,
      name: toolCall.function.name,
      arguments: toolCall.function.arguments,
    })) ?? []

  return AssistantSign(
    message.reasoning_content ?? "",
    message.content ?? "",
    toolCalls,
  )
}
