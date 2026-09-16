import * as Readline from "node:readline"
import process from "node:process"
import { errorReport } from "@xieyuheng/std.js/error"
import { agentRun, makeAgentState, type AgentOptions } from "../agent/index.ts"
import { authRead, makeModelConfig } from "../auth/index.ts"
import type { Sign } from "../model/Sign.ts"
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
      state.context.signs.length = 0
      console.log("history cleared")
      if (!isClosed) readline.prompt()
      continue
    }

    if (input === "/debug") {
      console.log(JSON.stringify(state.context.signs, null, 2))
      if (!isClosed) readline.prompt()
      continue
    }

    try {
      for await (const sign of agentRun(state, input, options)) {
        signPrint(sign)
      }
    } catch (error) {
      console.error(errorReport(error))
    }

    if (!isClosed) readline.prompt()
  }

  readline.close()
  console.log("bye")
}

function signPrint(sign: Sign): void {
  switch (sign.kind) {
    case "SystemSign":
    case "UserSign":
      console.log(sign.content)
      break
    case "AssistantSign":
      if (sign.content !== "") {
        console.log(sign.content)
      }
      for (const toolCall of sign.toolCalls) {
        console.error(`[tool call] ${toolCall.name} ${toolCall.arguments}`)
      }
      break
    case "ToolSign":
      console.error(`[tool result] ${sign.content}`)
      break
    case "ErrorSign":
      console.error(sign.message)
      break
  }
}
