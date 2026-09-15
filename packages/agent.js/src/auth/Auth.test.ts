import assert from "node:assert"
import { test } from "node:test"
import { authDeepSeekRead, authParse, makeModelConfig } from "./Auth.ts"

test("authParse parses deepseek api-key auth", () => {
  const auth = authParse(
    JSON.stringify({
      deepseek: {
        type: "api-key",
        key: "test-key",
      },
    }),
  )

  assert.deepStrictEqual(authDeepSeekRead(auth), {
    type: "api-key",
    key: "test-key",
  })
})

test("authParse rejects invalid JSON", () => {
  assert.throws(() => authParse("{"), /invalid JSON/)
})

test("authParse rejects unsupported auth type", () => {
  assert.throws(
    () =>
      authParse(
        JSON.stringify({
          deepseek: {
            type: "other",
            key: "test-key",
          },
        }),
      ),
    /invalid auth/,
  )
})

test("authParse rejects empty key", () => {
  assert.throws(
    () =>
      authParse(
        JSON.stringify({
          deepseek: {
            type: "api-key",
            key: "",
          },
        }),
      ),
    /invalid auth/,
  )
})

test("authDeepSeekRead rejects missing deepseek auth", () => {
  assert.throws(() => authDeepSeekRead({}), /auth\.deepseek is missing/)
})

test("makeModelConfig uses defaults", () => {
  assert.deepStrictEqual(
    makeModelConfig({
      deepseek: {
        type: "api-key",
        key: "test-key",
      },
    }),
    {
      apiKey: "test-key",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-flash",
    },
  )
})
