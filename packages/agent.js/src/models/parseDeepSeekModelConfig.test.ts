import assert from "node:assert"
import { test } from "node:test"
import { parseDeepSeekModelConfig } from "./deepseek/parseDeepSeekModelConfig.ts"

test("parseDeepSeekModelConfig parses model config", () => {
  assert.deepStrictEqual(
    parseDeepSeekModelConfig(
      "deepseek-flash",
      JSON.stringify({
        thinking: "disabled",
        reasoningEffort: "none",
      }),
    ),
    {
      name: "deepseek-flash",
      thinking: "disabled",
      reasoningEffort: "none",
    },
  )
})

test("parseDeepSeekModelConfig rejects invalid thinking", () => {
  assert.throws(
    () =>
      parseDeepSeekModelConfig(
        "deepseek-flash",
        JSON.stringify({
          thinking: "other",
          reasoningEffort: "none",
        }),
      ),
    /invalid model config/,
  )
})

test("parseDeepSeekModelConfig uses defaults", () => {
  assert.deepStrictEqual(
    parseDeepSeekModelConfig("deepseek-flash", JSON.stringify({})),
    {
      name: "deepseek-flash",
      thinking: "enabled",
      reasoningEffort: "high",
    },
  )
})
