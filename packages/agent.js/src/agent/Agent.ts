import type { Context } from "../model/Context.ts"
import type { Model } from "../model/Model.ts"
import type { Tool } from "../tool/Tool.ts"
import type { AgentEnv } from "./AgentEnv.ts"

export type AgentState = {
  context: Context
}

export type AgentOptions = {
  model: Model
  tools: Array<Tool>
  maxSteps: number
  env: AgentEnv
}

export function makeAgentState(): AgentState {
  return { context: { signs: [] } }
}
