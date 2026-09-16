export type Model = {
  interpret: ModelInterpret
}

export type ModelInterpret = (request: ModelRequest) => Promise<ModelResponse>

export type ModelRequest = {
  messages: Array<ModelMessage>
  tools: Array<ModelToolSpec>
}

export type ModelResponse = {
  message: ModelAssistantMessage
}

export type ModelMessage =
  | ModelSystemMessage
  | ModelUserMessage
  | ModelAssistantMessage
  | ModelToolMessage

export type ModelSystemMessage = {
  role: "system"
  content: string
}

export type ModelUserMessage = {
  role: "user"
  content: string
}

export type ModelAssistantMessage = {
  role: "assistant"
  content: string
  toolCalls: Array<ModelToolCall>
}

export type ModelToolMessage = {
  role: "tool"
  toolCallId: string
  content: string
}

export type ModelToolSpec = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type ModelToolCall = {
  id: string
  name: string
  arguments: string
}

export type ModelConfig = {
  apiKey: string
  baseUrl: string
  model: string
}
