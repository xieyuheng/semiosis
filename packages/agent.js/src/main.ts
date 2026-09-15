#!/usr/bin/env -S node

import * as cli from "@xieyuheng/cli.js"
import { errorReport } from "@xieyuheng/std.js/error"
import { getPackageJson } from "@xieyuheng/std.js/node"
import { fileURLToPath } from "node:url"
import { authRead, makeLlmConfig } from "./auth/index.ts"
import { chatRepl } from "./cli/chatRepl.ts"
import { makeOpenAiLlmChat } from "./llm/index.ts"

const { version } = getPackageJson(fileURLToPath(import.meta.url))
const router = cli.createRouter("agent.js", version)

router.defineRoutes(["smoke prompt", "chat"])

router.defineHandlers({
  smoke: ({ args: [prompt] }) => smokeRun(String(prompt)),
  chat: () => chatRepl(),
})

async function smokeRun(prompt: string): Promise<void> {
  const auth = authRead()
  const config = makeLlmConfig(auth)
  const llmChat = makeOpenAiLlmChat(config)
  const response = await llmChat([{ role: "user", content: prompt }])
  console.log(response.content)
}

try {
  await router.run(process.argv.slice(2))
} catch (error) {
  console.error(errorReport(error))
  process.exit(1)
}
