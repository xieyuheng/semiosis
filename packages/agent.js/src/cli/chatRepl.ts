import * as Readline from "node:readline"
import process from "node:process"
import { errorReport } from "@xieyuheng/std.js/error"
import { authRead, makeLlmConfig } from "../auth/index.ts"
import { chatReply, chatStateClear, makeChatState } from "../chat/index.ts"
import { makeOpenAiLlmChat } from "../llm/index.ts"

export async function chatRepl(): Promise<void> {
  const auth = authRead()
  const config = makeLlmConfig(auth)
  const llmChat = makeOpenAiLlmChat(config)
  const state = makeChatState()
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

  console.log("agent.js chat")
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
      chatStateClear(state)
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
      const content = await chatReply(state, input, llmChat)
      console.log(content)
    } catch (error) {
      console.error(errorReport(error))
    }

    if (!isClosed) readline.prompt()
  }

  readline.close()
  console.log("bye")
}
