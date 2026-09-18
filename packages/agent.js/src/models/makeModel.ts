import type { Model } from "../model/index.ts"
import { makeDeepSeekModel } from "./deepseek/makeDeepSeekModel.ts"
import { readDeepSeekModelConfig } from "./deepseek/readDeepSeekModelConfig.ts"
import { readDeepSeekProvider } from "./deepseek/readDeepSeekProvider.ts"

export function makeModel(providerName: string, modelName: string): Model {
  switch (providerName) {
    case "deepseek": {
      const provider = readDeepSeekProvider()
      const config = readDeepSeekModelConfig(modelName)
      return makeDeepSeekModel(provider, config)
    }

    default:
      throw new Error(`unknown provider: ${providerName}`)
  }
}
