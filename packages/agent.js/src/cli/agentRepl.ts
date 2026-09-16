import * as Readline from "node:readline"
import process from "node:process"
import { errorReport } from "@xieyuheng/std.js/error"
import {
  agentRun,
  makeAgentState,
  type AgentEvent,
  type AgentOptions,
} from "../agent/index.ts"
import { authRead, makeModelConfig } from "../auth/index.ts"
import { makeOpenAiModel } from "../models/open-ai/index.ts"
import { makeEchoTool } from "../tools/index.ts"

export async function agentRepl(): Promise<void> {
  const auth = authRead()
  const config = makeModelConfig(auth)
  const model = makeOpenAiModel(config)
  const state = makeAgentState()
  const options: AgentOptions = {
    model,
    tools: [makeEchoTool()],
    maxSteps: 8,
    env: { cwd: process.cwd() },
  }

  const readline = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const lines: Array<string> = []
  let isClosed = false
  let wake: (() => void) | undefined

  readline.on("line", (line) => {
    lines.push(line)
    wake?.()
    wake = undefined
  })

  readline.on("close", () => {
    isClosed = true
    wake?.()
    wake = undefined
  })

  console.log("agent.js repl")
  console.log("commands: /exit /clear /debug")

  readline.setPrompt("> ")
  readline.prompt()

  while (true) {
    if (lines.length === 0) {
      if (isClosed) break
      await new Promise<void>((resolve) => {
        wake = resolve
      })
      continue
    }

    const line = lines.shift() as string
    const input = line.trim()

    if (input === "/exit") break

    if (input === "") {
      if (!isClosed) readline.prompt()
      continue
    }

    if (input === "/clear") {
      state.messages.length = 0
      console.log("history cleared")
      if (!isClosed) readline.prompt()
      continue
    }

    if (input === "/debug") {
      console.log(JSON.stringify(state.messages, null, 2))
      if (!isClosed) readline.prompt()
      continue
    }

    try {
      for await (const event of agentRun(state, input, options)) {
        agentEventPrint(event)
      }
    } catch (error) {
      console.error(errorReport(error))
    }

    if (!isClosed) readline.prompt()
  }

  readline.close()
  console.log("bye")
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
