import OpenAI from "openai"
import type {
  LlmAssistantMessage,
  LlmChat,
  LlmConfig,
  LlmMessage,
  LlmRequest,
  LlmToolCall,
  LlmToolSpec,
} from "./Llm.ts"

export function makeOpenAiLlmChat(config: LlmConfig): LlmChat {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })

  return async (request: LlmRequest) => {
    const tools = request.tools.map(makeOpenAiTool)
    const response = await client.chat.completions.create({
      model: config.model,
      messages: request.messages.map(makeOpenAiMessage),
      ...(tools.length === 0 ? {} : { tools }),
      reasoning_effort: "none",
    })

    const choice = response.choices[0]
    if (choice === undefined) {
      throw new Error("[makeOpenAiLlmChat] response.choices is empty")
    }

    return { message: makeLlmAssistantMessage(choice.message) }
  }
}

function makeOpenAiMessage(
  message: LlmMessage,
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

function makeOpenAiTool(tool: LlmToolSpec): OpenAI.Chat.ChatCompletionTool {
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
  toolCall: LlmToolCall,
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

function makeLlmAssistantMessage(
  message: OpenAI.Chat.ChatCompletionMessage,
): LlmAssistantMessage {
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
