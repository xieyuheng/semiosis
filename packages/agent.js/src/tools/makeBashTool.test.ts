import assert from "node:assert"
import process from "node:process"
import { test } from "node:test"
import { makeAgent } from "../agent/index.ts"
import type { Model } from "../model/Model.ts"
import { AssistantSign } from "../sign/index.ts"
import { makeBashTool, type BashToolOptions } from "./makeBashTool.ts"

const model: Model = {
  interpret: async () => ({
    sign: AssistantSign("", []),
  }),
}

function makeTestBashTool(options: Omit<BashToolOptions, "description">) {
  const tool = makeBashTool({
    description: "",
    ...options,
  })
  const agent = makeAgent(model, {
    cwd: process.cwd(),
    tools: [tool],
    maxSteps: 1,
  })
  return { tool, agent }
}

test("makeBashTool runs command and returns stdout", async () => {
  const { tool, agent } = makeTestBashTool({
    timeoutMs: 5000,
    maxOutputChars: 100,
  })

  const output = await tool.handler(agent, {
    command: "printf hello",
  })

  assert.strictEqual(output, "exit_code: 0\nstdout:\nhello")
})

test("makeBashTool returns stderr and exit code", async () => {
  const { tool, agent } = makeTestBashTool({
    timeoutMs: 5000,
    maxOutputChars: 100,
  })

  const output = await tool.handler(agent, {
    command: "printf out; printf err >&2; exit 3",
  })

  assert.strictEqual(output, "exit_code: 3\nstdout:\nout\nstderr:\nerr")
})

test("makeBashTool truncates large output", async () => {
  const { tool, agent } = makeTestBashTool({
    timeoutMs: 5000,
    maxOutputChars: 4,
  })

  const output = await tool.handler(agent, {
    command: "printf 1234567890",
  })

  assert.strictEqual(output, "exit_code: 0\nstdout:\n1234\n[output truncated]")
})
