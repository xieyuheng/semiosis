import type { ToolCall } from "../tool/index.ts"

export type Sign = SystemSign | UserSign | AssistantSign | ToolSign | ErrorSign

export type SystemSign = {
  kind: "SystemSign"
  content: string
}

export function SystemSign(content: string): SystemSign {
  return {
    kind: "SystemSign",
    content,
  }
}

export function isSystemSign(value: Sign): value is SystemSign {
  return value.kind === "SystemSign"
}

export function asSystemSign(value: Sign): SystemSign {
  if (isSystemSign(value)) return value
  throw new Error(`[asSystemSign] fail on: ${value.kind}`)
}

export type UserSign = {
  kind: "UserSign"
  content: string
}

export function UserSign(content: string): UserSign {
  return {
    kind: "UserSign",
    content,
  }
}

export function isUserSign(value: Sign): value is UserSign {
  return value.kind === "UserSign"
}

export function asUserSign(value: Sign): UserSign {
  if (isUserSign(value)) return value
  throw new Error(`[asUserSign] fail on: ${value.kind}`)
}

export type AssistantSign = {
  kind: "AssistantSign"
  content: string
  reasoning: string
  toolCalls: Array<ToolCall>
}

export function AssistantSign(
  content: string,
  reasoning: string,
  toolCalls: Array<ToolCall>,
): AssistantSign {
  return {
    kind: "AssistantSign",
    content,
    reasoning,
    toolCalls,
  }
}

export function isAssistantSign(value: Sign): value is AssistantSign {
  return value.kind === "AssistantSign"
}

export function asAssistantSign(value: Sign): AssistantSign {
  if (isAssistantSign(value)) return value
  throw new Error(`[asAssistantSign] fail on: ${value.kind}`)
}

export type ToolSign = {
  kind: "ToolSign"
  toolCallId: string
  content: string
}

export function ToolSign(toolCallId: string, content: string): ToolSign {
  return {
    kind: "ToolSign",
    toolCallId,
    content,
  }
}

export function isToolSign(value: Sign): value is ToolSign {
  return value.kind === "ToolSign"
}

export function asToolSign(value: Sign): ToolSign {
  if (isToolSign(value)) return value
  throw new Error(`[asToolSign] fail on: ${value.kind}`)
}

export type ErrorSign = {
  kind: "ErrorSign"
  message: string
}

export function ErrorSign(message: string): ErrorSign {
  return {
    kind: "ErrorSign",
    message,
  }
}

export function isErrorSign(value: Sign): value is ErrorSign {
  return value.kind === "ErrorSign"
}

export function asErrorSign(value: Sign): ErrorSign {
  if (isErrorSign(value)) return value
  throw new Error(`[asErrorSign] fail on: ${value.kind}`)
}
