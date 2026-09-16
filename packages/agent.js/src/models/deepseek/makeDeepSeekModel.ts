import type { Model } from "../../model/index.ts"
import { makeOpenAiModel } from "../open-ai/index.ts"
import type { DeepSeekConfig } from "./DeepSeekConfig.ts"

export function makeDeepSeekModel(config: DeepSeekConfig): Model {
  return makeOpenAiModel(
    {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
    },
    {
      requestParams: () => ({
        reasoning_effort:
          config.thinking === "enabled" ? config.reasoningEffort : "none",
        thinking: {
          type: config.thinking,
        },
      }),
    },
  )
}
