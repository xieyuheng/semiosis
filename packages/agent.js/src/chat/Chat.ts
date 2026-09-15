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
  const response = await llmChat([...state.messages, userMessage])
  state.messages.push(userMessage)
  state.messages.push({ role: "assistant", content: response.content })
  return response.content
}
