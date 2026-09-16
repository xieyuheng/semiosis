import { makeModelConfig, type Auth } from "../../auth/index.ts"
import type { DeepSeekConfig } from "./DeepSeekConfig.ts"

export function makeDeepSeekConfig(auth: Auth): DeepSeekConfig {
  const config = makeModelConfig(auth)
  return {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    thinking: "disabled",
    reasoningEffort: "none",
  }
}
