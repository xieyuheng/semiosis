export type DeepSeekConfig = {
  apiKey: string
  baseUrl: string
  model: string
  thinking: "enabled" | "disabled"
  reasoningEffort: "none" | "low" | "high" | "max"
}
