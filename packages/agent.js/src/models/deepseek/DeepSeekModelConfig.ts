export type DeepSeekModelConfig = {
  name: string
  thinking: "enabled" | "disabled"
  reasoningEffort: "none" | "low" | "high" | "max"
}
