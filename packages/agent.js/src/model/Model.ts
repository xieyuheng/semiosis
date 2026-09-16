import type { ToolSpec } from "../tool/index.ts"
import type { Context } from "./Context.ts"
import type { Sign } from "../sign/index.ts"

export type Model = {
  interpret: ModelInterpret
}

export type ModelInterpret = (input: ModelInput) => Promise<ModelOutput>

export type ModelInput = {
  context: Context
  tools: Array<ToolSpec>
}

export type ModelOutput = {
  sign: Sign
}

export type ModelConfig = {
  apiKey: string
  baseUrl: string
  model: string
}
