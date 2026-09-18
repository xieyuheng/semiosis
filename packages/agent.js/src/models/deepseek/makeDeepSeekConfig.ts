import type { Provider } from "../../provider/index.ts"
import type { DeepSeekConfig } from "./DeepSeekConfig.ts"

export function makeDeepSeekConfig(provider: Provider): DeepSeekConfig {
  return {
    apiKey: provider.key,
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-flash",
    thinking: "disabled",
    reasoningEffort: "none",
  }
}
