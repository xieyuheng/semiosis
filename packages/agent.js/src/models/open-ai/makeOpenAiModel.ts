import OpenAI from "openai"
import type {
  Model,
  ModelConfig,
  ModelInput,
  ModelToolSpec,
} from "../../model/Model.ts"
import type { AssistantSign, Sign, ToolCall } from "../../model/Sign.ts"

export function makeOpenAiModel(config: ModelConfig): Model {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })

  return {
    interpret: async (input: ModelInput) => {
      const tools = input.tools.map(makeOpenAiTool)
      const output = await client.chat.completions.create({
        model: config.model,
        messages: input.context.signs.map(makeOpenAiMessage),
        ...(tools.length === 0 ? {} : { tools }),
        reasoning_effort: "none",
      })

      const choice = output.choices[0]
      if (choice === undefined) {
        throw new Error("[makeOpenAiModel] output.choices is empty")
      }

      return { sign: makeAssistantSign(choice.message) }
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
      if (sign.toolCalls.length === 0) {
        return { role: "assistant", content: sign.content }
      }
      return {
        role: "assistant",
        content: sign.content,
        tool_calls: sign.toolCalls.map(makeOpenAiToolCall),
      }
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

function makeOpenAiTool(tool: ModelToolSpec): OpenAI.Chat.ChatCompletionTool {
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
  const toolCalls =
    message.tool_calls
      ?.filter((toolCall) => toolCall.type === "function")
      .map((toolCall) => ({
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
      })) ?? []

  return {
    kind: "AssistantSign",
    content: message.content ?? "",
    toolCalls,
  }
}
