import assert from "node:assert"
import { test } from "node:test"
import { parseDeepSeekProvider } from "./deepseek/parseDeepSeekProvider.ts"

test("parseDeepSeekProvider parses provider", () => {
  assert.deepStrictEqual(
    parseDeepSeekProvider(
      JSON.stringify({
        baseUrl: "https://api.deepseek.com",
        key: "test-key",
      }),
    ),
    {
      baseUrl: "https://api.deepseek.com",
      key: "test-key",
    },
  )
})

test("parseDeepSeekProvider rejects invalid JSON", () => {
  assert.throws(() => parseDeepSeekProvider("{"), /invalid JSON/)
})

test("parseDeepSeekProvider rejects empty key", () => {
  assert.throws(
    () =>
      parseDeepSeekProvider(
        JSON.stringify({
          baseUrl: "https://api.deepseek.com",
          key: "",
        }),
      ),
    /invalid provider/,
  )
})
