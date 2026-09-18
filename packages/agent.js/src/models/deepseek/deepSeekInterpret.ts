import { AssistantSign } from "../../sign/index.ts"
import type { ModelInput, ModelOutput } from "../../model/index.ts"
import type { ToolCall, ToolSpec } from "../../tool/index.ts"
import type { Sign } from "../../sign/index.ts"
import type { DeepSeekModelConfig } from "./DeepSeekModelConfig.ts"
import type { DeepSeekProvider } from "./DeepSeekProvider.ts"

type DeepSeekMessage = {
  content?: string | null
  reasoning_content?: string | null
  tool_calls?: Array<DeepSeekToolCall>
}

type DeepSeekToolCall = {
  id: string
  function: {
    name: string
    arguments: string
  }
}

type DeepSeekChatOutput = {
  choices?: Array<{
    message?: DeepSeekMessage
  }>
}

export async function deepSeekInterpret(
  provider: DeepSeekProvider,
  config: DeepSeekModelConfig,
  input: ModelInput,
): Promise<ModelOutput> {
  const body: Record<string, unknown> = {
    model: config.name,
    messages: input.context.signs.map(makeDeepSeekMessage),
    thinking: {
      type: config.thinking,
    },
    reasoning_effort:
      config.thinking === "enabled" ? config.reasoningEffort : "none",
  }

  if (input.tools.length !== 0) {
    body.tools = input.tools.map(makeDeepSeekTool)
  }

  const response = await fetch(deepSeekInterpretUrl(provider.baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()

  if (!response.ok) {
    throw new Error(`[deepSeekInterpret] HTTP ${response.status}: ${text}`)
  }

  const output = JSON.parse(text) as DeepSeekChatOutput
  const message = output.choices?.[0]?.message

  if (message === undefined) {
    throw new Error("[deepSeekInterpret] output.choices[0].message is missing")
  }

  return {
    sign: makeAssistantSign(message),
  }
}

function deepSeekInterpretUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`
}

function makeDeepSeekMessage(sign: Sign): Record<string, unknown> {
  switch (sign.kind) {
    case "SystemSign":
      return { role: "system", content: sign.content }
    case "UserSign":
      return { role: "user", content: sign.content }
    case "AssistantSign": {
      const message: Record<string, unknown> = {
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

function makeDeepSeekTool(tool: ToolSpec): Record<string, unknown> {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }
}

function makeDeepSeekToolCall(toolCall: ToolCall): Record<string, unknown> {
  return {
    id: toolCall.id,
    type: "function",
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
