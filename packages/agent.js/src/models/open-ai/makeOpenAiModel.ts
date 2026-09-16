import type { ToolCall, ToolSpec } from "../../tool/index.ts"
import { errorReport } from "@xieyuheng/std.js/error"
import OpenAI from "openai"
import type { Model, ModelConfig, ModelInput } from "../../model/index.ts"
import { AssistantSign, ErrorSign, type Sign } from "../../sign/index.ts"

export type OpenAiModelOptions = {
  requestParams?: () => Record<string, unknown>
}

type OpenAiAssistantMessageParam =
  OpenAI.Chat.ChatCompletionAssistantMessageParam & {
    reasoning_content?: string
  }

export function makeOpenAiModel(
  config: ModelConfig,
  options: OpenAiModelOptions = {},
): Model {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })

  return {
    interpret: async (input: ModelInput) => {
      try {
        const tools = input.tools.map(makeOpenAiTool)
        const requestParams = options.requestParams?.() ?? {}
        const output = await client.chat.completions.create({
          model: config.model,
          messages: input.context.signs.map(makeOpenAiMessage),
          ...(tools.length === 0 ? {} : { tools }),
          reasoning_effort: "none",
          ...requestParams,
        } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming)

        const choice = output.choices[0]
        if (choice === undefined) {
          throw new Error("[makeOpenAiModel] output.choices is empty")
        }

        return { sign: makeAssistantSign(choice.message) }
      } catch (error) {
        return {
          sign: ErrorSign(`[makeOpenAiModel] ${errorReport(error)}`),
        }
      }
    },
  }
}

function makeOpenAiMessage(sign: Sign): OpenAI.Chat.ChatCompletionMessageParam {
  switch (sign.kind) {
    case "SystemSign":
      return { role: "system", content: sign.content }
    case "UserSign":
      return { role: "user", content: sign.content }
    case "AssistantSign": {
      const message: OpenAiAssistantMessageParam = {
        role: "assistant",
        content: sign.content,
      }
      if (sign.reasoning !== "") {
        message.reasoning_content = sign.reasoning
      }
      if (sign.toolCalls.length !== 0) {
        message.tool_calls = sign.toolCalls.map(makeOpenAiToolCall)
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
      throw new Error("[makeOpenAiMessage] cannot send ErrorSign to OpenAI")
  }
}

function makeOpenAiTool(tool: ToolSpec): OpenAI.Chat.ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }
}

function makeOpenAiToolCall(
  toolCall: ToolCall,
): OpenAI.Chat.ChatCompletionMessageFunctionToolCall {
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
  message: OpenAI.Chat.ChatCompletionMessage,
): AssistantSign {
  const reasoning =
    (message as { reasoning_content?: string | null }).reasoning_content ?? ""

  const toolCalls =
    message.tool_calls
      ?.filter((toolCall) => toolCall.type === "function")
      .map((toolCall) => ({
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
      })) ?? []

  return AssistantSign(message.content ?? "", reasoning, toolCalls)
}
