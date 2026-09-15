import OpenAI from "openai"
import type {
  ModelAssistantMessage,
  Model,
  ModelConfig,
  ModelMessage,
  ModelRequest,
  ModelToolCall,
  ModelToolSpec,
} from "./Model.ts"

export function makeOpenAiModel(config: ModelConfig): Model {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })

  return {
    interpret: async (request: ModelRequest) => {
      const tools = request.tools.map(makeOpenAiTool)
      const response = await client.chat.completions.create({
        model: config.model,
        messages: request.messages.map(makeOpenAiMessage),
        ...(tools.length === 0 ? {} : { tools }),
        reasoning_effort: "none",
      })

      const choice = response.choices[0]
      if (choice === undefined) {
        throw new Error("[makeOpenAiModel] response.choices is empty")
      }

      return { message: makeModelAssistantMessage(choice.message) }
    },
  }
}

function makeOpenAiMessage(
  message: ModelMessage,
): OpenAI.Chat.ChatCompletionMessageParam {
  switch (message.role) {
    case "system":
      return { role: "system", content: message.content }
    case "user":
      return { role: "user", content: message.content }
    case "assistant": {
      if (message.toolCalls.length === 0) {
        return { role: "assistant", content: message.content }
      }
      return {
        role: "assistant",
        content: message.content,
        tool_calls: message.toolCalls.map(makeOpenAiToolCall),
      }
    }
    case "tool":
      return {
        role: "tool",
        tool_call_id: message.toolCallId,
        content: message.content,
      }
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
  toolCall: ModelToolCall,
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

function makeModelAssistantMessage(
  message: OpenAI.Chat.ChatCompletionMessage,
): ModelAssistantMessage {
  const toolCalls =
    message.tool_calls
      ?.filter((toolCall) => toolCall.type === "function")
      .map((toolCall) => ({
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: toolCall.function.arguments,
      })) ?? []

  return {
    role: "assistant",
    content: message.content ?? "",
    toolCalls,
  }
}
