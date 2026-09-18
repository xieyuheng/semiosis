import { errorReport } from "@xieyuheng/std.js/error"
import type { DeepSeekClient } from "../../clients/deepseek/index.ts"
import type { Model } from "../../model/index.ts"
import { ErrorSign } from "../../sign/index.ts"
import { deepSeekInterpret } from "./deepSeekInterpret.ts"
import type { DeepSeekModelConfig } from "./DeepSeekModelConfig.ts"

export function makeDeepSeekModel(
  client: DeepSeekClient,
  config: DeepSeekModelConfig,
): Model {
  return {
    interpret: async (input) => {
      try {
        return await deepSeekInterpret(client, config, input)
      } catch (error) {
        return {
          sign: ErrorSign(`[makeDeepSeekModel] ${errorReport(error)}`),
        }
      }
    },
  }
}
