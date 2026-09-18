import assert from "node:assert"
import { test } from "node:test"
import { providerParse, providerRead } from "./Provider.ts"

test("providerParse parses api-key provider", () => {
  assert.deepStrictEqual(
    providerParse(
      JSON.stringify({
        type: "api-key",
        key: "test-key",
      }),
    ),
    {
      type: "api-key",
      key: "test-key",
    },
  )
})

test("providerParse rejects invalid JSON", () => {
  assert.throws(() => providerParse("{"), /invalid JSON/)
})

test("providerParse rejects unsupported provider type", () => {
  assert.throws(
    () =>
      providerParse(
        JSON.stringify({
          type: "other",
          key: "test-key",
        }),
      ),
    /invalid provider/,
  )
})

test("providerParse rejects empty key", () => {
  assert.throws(
    () =>
      providerParse(
        JSON.stringify({
          type: "api-key",
          key: "",
        }),
      ),
    /invalid provider/,
  )
})

test("providerRead rejects invalid provider name", () => {
  assert.throws(() => providerRead("../deepseek"), /invalid provider name/)
})
