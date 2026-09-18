import type { DeepSeekMessage } from "./DeepSeekMessage.ts"

export type DeepSeekChatCompletionOutput = {
  choices: Array<{
    message: DeepSeekMessage
  }>
}
