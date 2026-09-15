import process from "node:process"
import { authRead, makeLlmConfig } from "../auth/index.ts"
import { makeOpenAiLlmChat } from "../llm/index.ts"

const prompt = process.argv.slice(2).join(" ").trim()
if (prompt === "") {
  console.error("Usage: node src/cli/smoke.ts <prompt>")
  process.exit(1)
}

const auth = authRead()
const config = makeLlmConfig(auth)
const llmChat = makeOpenAiLlmChat(config)
const response = await llmChat([{ role: "user", content: prompt }])

console.log(response.content)
