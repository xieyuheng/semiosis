export type LlmConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

export type LlmToolCall = {
  id: string
  name: string
  arguments: string
}

export type LlmToolSpec = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type LlmSystemMessage = {
  role: "system"
  content: string
}

export type LlmUserMessage = {
  role: "user"
  content: string
}

export type LlmAssistantMessage = {
  role: "assistant"
  content: string
  toolCalls: Array<LlmToolCall>
}

export type LlmToolMessage = {
  role: "tool"
  toolCallId: string
  content: string
}

export type LlmMessage =
  LlmSystemMessage | LlmUserMessage | LlmAssistantMessage | LlmToolMessage

export type LlmRequest = {
  messages: Array<LlmMessage>
  tools: Array<LlmToolSpec>
}

export type LlmResponse = {
  message: LlmAssistantMessage
}

export type LlmChat = (request: LlmRequest) => Promise<LlmResponse>
