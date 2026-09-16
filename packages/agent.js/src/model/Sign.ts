export type Sign = SystemSign | UserSign | AssistantSign | ToolSign | ErrorSign

export type SystemSign = {
  kind: "SystemSign"
  content: string
}

export type UserSign = {
  kind: "UserSign"
  content: string
}

export type AssistantSign = {
  kind: "AssistantSign"
  content: string
  toolCalls: Array<ToolCall>
}

export type ToolSign = {
  kind: "ToolSign"
  toolCallId: string
  content: string
}

export type ErrorSign = {
  kind: "ErrorSign"
  message: string
}

export type ToolCall = {
  id: string
  name: string
  arguments: string
}
