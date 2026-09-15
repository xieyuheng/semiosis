import assert from "node:assert"
import { test } from "node:test"
import type { LlmChat } from "../llm/Llm.ts"
import { chatReply, chatStateClear, makeChatState } from "./Chat.ts"

test("chatReply appends user and assistant messages", async () => {
  const state = makeChatState()
  const llmChat: LlmChat = async (messages) => {
    assert.deepStrictEqual(messages, [{ role: "user", content: "hello" }])
    return { content: "hi" }
  }

  const content = await chatReply(state, "hello", llmChat)

  assert.strictEqual(content, "hi")
  assert.deepStrictEqual(state.messages, [
    { role: "user", content: "hello" },
    { role: "assistant", content: "hi" },
  ])
})

test("chatReply keeps history across turns", async () => {
  const state = makeChatState()
  const llmChat: LlmChat = async (messages) => {
    if (messages.length === 1) return { content: "hi" }
    assert.deepStrictEqual(messages, [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
      { role: "user", content: "again" },
    ])
    return { content: "yes" }
  }

  await chatReply(state, "hello", llmChat)
  const content = await chatReply(state, "again", llmChat)

  assert.strictEqual(content, "yes")
  assert.deepStrictEqual(state.messages, [
    { role: "user", content: "hello" },
    { role: "assistant", content: "hi" },
    { role: "user", content: "again" },
    { role: "assistant", content: "yes" },
  ])
})

test("chatStateClear clears history", () => {
  const state = makeChatState()
  state.messages.push(
    { role: "user", content: "hello" },
    { role: "assistant", content: "hi" },
  )

  chatStateClear(state)

  assert.deepStrictEqual(state.messages, [])
})

test("chatReply does not mutate state on error", async () => {
  const state = makeChatState()
  const llmChat: LlmChat = async () => {
    throw new Error("fail")
  }

  await assert.rejects(() => chatReply(state, "hello", llmChat), /fail/)
  assert.deepStrictEqual(state.messages, [])
})
