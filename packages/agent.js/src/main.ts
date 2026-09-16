#!/usr/bin/env -S node

import * as cli from "@xieyuheng/cli.js"
import { errorReport } from "@xieyuheng/std.js/error"
import { getPackageJson } from "@xieyuheng/std.js/node"
import { fileURLToPath } from "node:url"
import { agentRepl } from "./cli/agentRepl.ts"

const { version } = getPackageJson(fileURLToPath(import.meta.url))
const router = cli.createRouter("agent.js", version)

router.defineRoutes(["repl"])

router.defineHandlers({
  repl: () => agentRepl(),
})

try {
  await router.run(process.argv.slice(2))
} catch (error) {
  console.error(errorReport(error))
  process.exit(1)
}
