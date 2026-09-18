import type { Model } from "../../model/index.ts"
import { makeOpenAiModel } from "../open-ai/index.ts"
import type { DeepSeekModelConfig } from "./DeepSeekModelConfig.ts"
import type { DeepSeekProvider } from "./DeepSeekProvider.ts"

export function makeDeepSeekModel(
  provider: DeepSeekProvider,
  config: DeepSeekModelConfig,
): Model {
  return makeOpenAiModel(
    {
      apiKey: provider.key,
      baseUrl: provider.baseUrl,
      model: config.name,
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
