import { ErrorSign } from "../../sign/index.ts"
import { errorReport } from "@xieyuheng/std.js/error"
import type { Model } from "../../model/index.ts"
import type { DeepSeekModelConfig } from "./DeepSeekModelConfig.ts"
import type { DeepSeekProvider } from "./DeepSeekProvider.ts"
import { deepSeekInterpret } from "./deepSeekInterpret.ts"

export function makeDeepSeekModel(
  provider: DeepSeekProvider,
  config: DeepSeekModelConfig,
): Model {
  return {
    interpret: async (input) => {
      try {
        return await deepSeekInterpret(provider, config, input)
      } catch (error) {
        return {
          sign: ErrorSign(`[makeDeepSeekModel] ${errorReport(error)}`),
        }
      }
    },
  }
}
