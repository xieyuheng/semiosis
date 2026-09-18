import type { DeepSeekChatCompletionInput } from "./DeepSeekChatCompletionInput.ts"
import type { DeepSeekChatCompletionOutput } from "./DeepSeekChatCompletionOutput.ts"

export type DeepSeekChatCompletion = (
  input: DeepSeekChatCompletionInput,
) => Promise<DeepSeekChatCompletionOutput>

export type DeepSeekClient = {
  chatCompletion: DeepSeekChatCompletion
}
