import type { DeepSeekChatCompletionInput } from "./DeepSeekChatCompletionInput.ts"
import type { DeepSeekClient } from "./DeepSeekClient.ts"
import type { DeepSeekClientConfig } from "./DeepSeekClientConfig.ts"
import { parseDeepSeekChatCompletionOutput } from "./parseDeepSeekChatCompletionOutput.ts"

export function makeDeepSeekClient(
  config: DeepSeekClientConfig,
): DeepSeekClient {
  return {
    chatCompletion: async (input: DeepSeekChatCompletionInput) => {
      const body = makeDeepSeekChatCompletionBody(input)
      const response = await fetch(deepSeekChatCompletionUrl(config.baseUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.key}`,
        },
        body: JSON.stringify(body),
      })

      const text = await response.text()

      if (!response.ok) {
        throw new Error(`[makeDeepSeekClient] HTTP ${response.status}: ${text}`)
      }

      const output = parseDeepSeekChatCompletionOutput(text)

      return output
    },
  }
}

function makeDeepSeekChatCompletionBody(
  input: DeepSeekChatCompletionInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    messages: input.messages,
    thinking: input.thinking,
    reasoning_effort: input.reasoning_effort,
  }

  if (input.tools.length !== 0) {
    body.tools = input.tools
  }

  return body
}

function deepSeekChatCompletionUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`
}
