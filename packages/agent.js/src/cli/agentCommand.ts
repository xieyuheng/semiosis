import { errorReport } from "@xieyuheng/std.js/error"
import { agentRun, makeAgentState, type AgentEvent } from "../agent/index.ts"
import { authRead, makeModelConfig } from "../auth/index.ts"
import { makeOpenAiModel } from "../model/index.ts"
import { makeEchoTool } from "../tool/index.ts"

export async function agentCommandRun(prompt: string): Promise<void> {
  const auth = authRead()
  const config = makeModelConfig(auth)
  const model = makeOpenAiModel(config)
  const state = makeAgentState()

  for await (const event of agentRun(state, prompt, {
    model,
    tools: [makeEchoTool()],
    maxSteps: 8,
  })) {
    agentEventPrint(event)
  }
}

function agentEventPrint(event: AgentEvent): void {
  switch (event.type) {
    case "assistant_text":
      console.log(event.text)
      break
    case "tool_call":
      console.error(
        `[tool call] ${event.toolCall.name} ${event.toolCall.arguments}`,
      )
      break
    case "tool_result":
      console.error(`[tool result] ${event.content}`)
      break
    case "error":
      console.error(event.message)
      break
    case "done":
      break
  }
}
