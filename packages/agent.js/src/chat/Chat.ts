import type { LlmChat, LlmMessage } from "../llm/Llm.ts"

export type ChatState = {
  messages: Array<LlmMessage>
}

export function makeChatState(): ChatState {
  return { messages: [] }
}

export function chatStateClear(state: ChatState): void {
  state.messages.length = 0
}

export async function chatReply(
  state: ChatState,
  input: string,
  llmChat: LlmChat,
): Promise<string> {
  const userMessage: LlmMessage = { role: "user", content: input }
  const response = await llmChat({
    messages: [...state.messages, userMessage],
    tools: [],
  })
  state.messages.push(userMessage)
  state.messages.push(response.message)
  return response.message.content
}
