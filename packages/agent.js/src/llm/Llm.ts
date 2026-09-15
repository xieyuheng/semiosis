export type LlmMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type LlmConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

export type LlmResponse = {
  content: string
}

export type LlmChat = (messages: Array<LlmMessage>) => Promise<LlmResponse>
