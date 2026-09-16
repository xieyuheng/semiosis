import type { Context } from "./Context.ts"
import type { AssistantSign } from "./Sign.ts"

export type Model = {
  interpret: ModelInterpret
}

export type ModelInterpret = (request: ModelInput) => Promise<ModelOutput>

export type ModelInput = {
  context: Context
  tools: Array<ModelToolSpec>
}

export type ModelOutput = {
  sign: AssistantSign
}

export type ModelConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

export type ModelToolSpec = {
  name: string
  description: string
  parameters: Record<string, unknown>
}
