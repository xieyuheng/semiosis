import OpenAI from "openai"
import type { LlmChat, LlmConfig, LlmMessage } from "./Llm.ts"

export function makeOpenAiLlmChat(config: LlmConfig): LlmChat {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })

  return async (messages: Array<LlmMessage>) => {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: messages.map(makeOpenAiMessage),
      reasoning_effort: "none",
    })

    const choice = response.choices[0]
    if (choice === undefined) {
      throw new Error("[makeOpenAiLlmChat] response.choices is empty")
    }

    const content = choice.message.content
    if (content === null) {
      throw new Error("[makeOpenAiLlmChat] response message content is null")
    }

    return { content }
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
    case "assistant":
      return { role: "assistant", content: message.content }
  }
}
