import * as Readline from "node:readline"
import process from "node:process"
import { errorReport } from "@xieyuheng/std.js/error"
import { agentRun, type Agent } from "../agent/index.ts"
import { formatSign } from "../format/index.ts"

export async function startAgentRepl(agent: Agent): Promise<void> {
  const readline = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const lines: Array<string> = []
  let isClosed = false
  let wake: (() => void) | undefined = undefined

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
  console.log("commands: /exit /debug")

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

    if (input === "/debug") {
      console.log(JSON.stringify(agent.context.signs, null, 2))
      if (!isClosed) readline.prompt()
      continue
    }

    try {
      for await (const sign of agentRun(agent, input)) {
        const output = formatSign(sign)
        if (output !== "") {
          console.log(output)
        }
      }
    } catch (error) {
      console.log(errorReport(error))
    }

    if (!isClosed) readline.prompt()
  }

  readline.close()
  console.log("bye")
}
