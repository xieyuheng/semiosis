export type DeepSeekToolCall = {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}
