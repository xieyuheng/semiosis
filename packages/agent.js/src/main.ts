#!/usr/bin/env -S node

import * as cli from "@xieyuheng/cli.js"
import { errorReport } from "@xieyuheng/std.js/error"
import { getPackageJson } from "@xieyuheng/std.js/node"
import process from "node:process"
import { fileURLToPath } from "node:url"
import { makeAgent } from "./agent/index.ts"
import { makeModel } from "./models/index.ts"
import { startAgentRepl } from "./repl/index.ts"
import { makeBashTool } from "./tools/index.ts"

const { version } = getPackageJson(fileURLToPath(import.meta.url))
const router = cli.createRouter("agent.js", version)

router.defineRoutes(["repl"])

router.defineHandlers({
  repl: () => {
    const model = makeModel("deepseek", "deepseek-flash")
    const agent = makeAgent(model, {
      system: "You are a helpful software engineer assistant.",
      cwd: process.cwd(),
      tools: [makeBashTool()],
      maxSteps: 8,
    })
    return startAgentRepl(agent)
  },
})

try {
  await router.run(process.argv.slice(2))
} catch (error) {
  console.log(errorReport(error))
  process.exit(1)
}
