import assert from "node:assert"
import { test } from "node:test"
import type { LlmChat, LlmMessage } from "../llm/Llm.ts"
import { makeEchoTool } from "../tool/index.ts"
import { agentRun, makeAgentState } from "./index.ts"

test("agentRun runs tool calls and returns final answer", async () => {
  const requests: Array<Array<LlmMessage>> = []
  const llmChat: LlmChat = async (request) => {
    requests.push(request.messages)
    if (request.messages.length === 1) {
      return {
        message: {
          role: "assistant",
          content: "",
          toolCalls: [
            {
              id: "call-1",
              name: "echo",
              arguments: '{"text":"hello"}',
            },
          ],
        },
      }
    }

    return {
      message: {
        role: "assistant",
        content: "done",
        toolCalls: [],
      },
    }
  }

  const state = makeAgentState()
  const events = []
  for await (const event of agentRun(state, "use echo", {
    llmChat,
    tools: [makeEchoTool()],
    maxSteps: 4,
  })) {
    events.push(event)
  }

  assert.deepStrictEqual(state.messages, [
    { role: "user", content: "use echo" },
    {
      role: "assistant",
      content: "",
      toolCalls: [
        {
          id: "call-1",
          name: "echo",
          arguments: '{"text":"hello"}',
        },
      ],
    },
    { role: "tool", toolCallId: "call-1", content: "hello" },
    { role: "assistant", content: "done", toolCalls: [] },
  ])

  assert.deepStrictEqual(events, [
    {
      type: "tool_call",
      toolCall: {
        id: "call-1",
        name: "echo",
        arguments: '{"text":"hello"}',
      },
    },
    { type: "tool_result", toolCallId: "call-1", content: "hello" },
    { type: "assistant_text", text: "done" },
    { type: "done" },
  ])
})

test("agentRun sends tool specs to llm chat", async () => {
  let toolNames: Array<string> = []
  const llmChat: LlmChat = async (request) => {
    toolNames = request.tools.map((tool) => tool.name)
    return {
      message: { role: "assistant", content: "done", toolCalls: [] },
    }
  }

  const state = makeAgentState()
  for await (const _event of agentRun(state, "hello", {
    llmChat,
    tools: [makeEchoTool()],
    maxSteps: 1,
  })) {
    void _event
  }

  assert.deepStrictEqual(toolNames, ["echo"])
})

test("agentRun reports max steps", async () => {
  const llmChat: LlmChat = async () => ({
    message: {
      role: "assistant",
      content: "",
      toolCalls: [
        {
          id: "call-1",
          name: "echo",
          arguments: '{"text":"hello"}',
        },
      ],
    },
  })

  const state = makeAgentState()
  const events = []
  for await (const event of agentRun(state, "loop", {
    llmChat,
    tools: [makeEchoTool()],
    maxSteps: 1,
  })) {
    events.push(event)
  }

  assert.deepStrictEqual(events, [
    {
      type: "tool_call",
      toolCall: {
        id: "call-1",
        name: "echo",
        arguments: '{"text":"hello"}',
      },
    },
    { type: "tool_result", toolCallId: "call-1", content: "hello" },
    {
      type: "error",
      message: "[agentRun] max steps reached: 1",
    },
    { type: "done" },
  ])
})

test("agentRun returns tool errors to the model", async () => {
  const llmChat: LlmChat = async (request) => {
    if (request.messages.length === 1) {
      return {
        message: {
          role: "assistant",
          content: "",
          toolCalls: [
            {
              id: "call-1",
              name: "missing",
              arguments: "{}",
            },
            {
              id: "call-2",
              name: "echo",
              arguments: "{",
            },
          ],
        },
      }
    }

    return {
      message: { role: "assistant", content: "fixed", toolCalls: [] },
    }
  }

  const state = makeAgentState()
  const events = []
  for await (const event of agentRun(state, "break tools", {
    llmChat,
    tools: [makeEchoTool()],
    maxSteps: 4,
  })) {
    events.push(event)
  }

  assert.deepStrictEqual(state.messages[2], {
    role: "tool",
    toolCallId: "call-1",
    content: "[agentRun] unknown tool: missing",
  })

  assert.strictEqual(state.messages[3].role, "tool")
  assert.strictEqual(state.messages[3].toolCallId, "call-2")
  assert.match(state.messages[3].content, /invalid arguments for tool echo/)

  assert.deepStrictEqual(state.messages[4], {
    role: "assistant",
    content: "fixed",
    toolCalls: [],
  })
})
