import assert from "node:assert"
import { test } from "node:test"
import { makeDeepSeekConfig } from "./makeDeepSeekConfig.ts"

test("makeDeepSeekConfig uses defaults", () => {
  assert.deepStrictEqual(
    makeDeepSeekConfig({
      type: "api-key",
      key: "test-key",
    }),
    {
      apiKey: "test-key",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-flash",
      thinking: "disabled",
      reasoningEffort: "none",
    },
  )
})
