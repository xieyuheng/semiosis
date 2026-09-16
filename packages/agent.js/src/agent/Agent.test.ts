import assert from "node:assert"
import { test } from "node:test"
import type { Model } from "../model/Model.ts"
import type { Sign } from "../model/Sign.ts"
import type { Tool } from "../tool/Tool.ts"
import { makeEchoTool } from "../tools/index.ts"
import { agentRun, makeAgentState } from "./index.ts"

test("agentRun runs tool calls and returns final answer", async () => {
  const requests: Array<Array<Sign>> = []
  const model: Model = {
    interpret: async (request) => {
      requests.push(request.context.signs)
      if (request.context.signs.length === 1) {
        return {
          sign: {
            kind: "AssistantSign",
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
        sign: {
          kind: "AssistantSign",
          content: "done",
          toolCalls: [],
        },
      }
    },
  }

  const state = makeAgentState()
  const signs: Array<Sign> = []
  for await (const sign of agentRun(state, "use echo", {
    model,
    tools: [makeEchoTool()],
    maxSteps: 4,
    env: { cwd: "/workspace" },
  })) {
    signs.push(sign)
  }

  assert.deepStrictEqual(state.context.signs, [
    { kind: "UserSign", content: "use echo" },
    {
      kind: "AssistantSign",
      content: "",
      toolCalls: [
        {
          id: "call-1",
          name: "echo",
          arguments: '{"text":"hello"}',
        },
      ],
    },
    { kind: "ToolSign", toolCallId: "call-1", content: "hello" },
    { kind: "AssistantSign", content: "done", toolCalls: [] },
  ])

  assert.deepStrictEqual(signs, [
    {
      kind: "AssistantSign",
      content: "",
      toolCalls: [
        {
          id: "call-1",
          name: "echo",
          arguments: '{"text":"hello"}',
        },
      ],
    },
    { kind: "ToolSign", toolCallId: "call-1", content: "hello" },
    { kind: "AssistantSign", content: "done", toolCalls: [] },
  ])
})

test("agentRun sends tool specs to model interpret", async () => {
  let toolNames: Array<string> = []
  const model: Model = {
    interpret: async (request) => {
      toolNames = request.tools.map((tool) => tool.name)
      return {
        sign: { kind: "AssistantSign", content: "done", toolCalls: [] },
      }
    },
  }

  const state = makeAgentState()
  for await (const _sign of agentRun(state, "hello", {
    model,
    tools: [makeEchoTool()],
    maxSteps: 1,
    env: { cwd: "/workspace" },
  })) {
    void _sign
  }

  assert.deepStrictEqual(toolNames, ["echo"])
})

test("agentRun reports max steps", async () => {
  const model: Model = {
    interpret: async () => ({
      sign: {
        kind: "AssistantSign",
        content: "",
        toolCalls: [
          {
            id: "call-1",
            name: "echo",
            arguments: '{"text":"hello"}',
          },
        ],
      },
    }),
  }

  const state = makeAgentState()
  const signs: Array<Sign> = []
  for await (const sign of agentRun(state, "loop", {
    model,
    tools: [makeEchoTool()],
    maxSteps: 1,
    env: { cwd: "/workspace" },
  })) {
    signs.push(sign)
  }

  assert.deepStrictEqual(signs, [
    {
      kind: "AssistantSign",
      content: "",
      toolCalls: [
        {
          id: "call-1",
          name: "echo",
          arguments: '{"text":"hello"}',
        },
      ],
    },
    { kind: "ToolSign", toolCallId: "call-1", content: "hello" },
    {
      kind: "ErrorSign",
      message: "[agentRun] max steps reached: 1",
    },
  ])
})

test("agentRun returns tool errors to the model", async () => {
  const model: Model = {
    interpret: async (request) => {
      if (request.context.signs.length === 1) {
        return {
          sign: {
            kind: "AssistantSign",
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
        sign: { kind: "AssistantSign", content: "fixed", toolCalls: [] },
      }
    },
  }

  const state = makeAgentState()
  const signs: Array<Sign> = []
  for await (const sign of agentRun(state, "break tools", {
    model,
    tools: [makeEchoTool()],
    maxSteps: 4,
    env: { cwd: "/workspace" },
  })) {
    signs.push(sign)
  }

  assert.deepStrictEqual(state.context.signs[2], {
    kind: "ToolSign",
    toolCallId: "call-1",
    content: "[agentRun] unknown tool: missing",
  })

  const toolSign = state.context.signs[3]
  assert.strictEqual(toolSign.kind, "ToolSign")
  if (toolSign.kind !== "ToolSign") {
    throw new Error("expected ToolSign")
  }
  assert.strictEqual(toolSign.toolCallId, "call-2")
  assert.match(toolSign.content, /invalid arguments for tool echo/)

  assert.deepStrictEqual(state.context.signs[4], {
    kind: "AssistantSign",
    content: "fixed",
    toolCalls: [],
  })
})

test("agentRun passes env to tool handler", async () => {
  let envCwd = ""
  const tool: Tool = {
    spec: {
      name: "env",
      description: "Read env.cwd.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    handler: (env) => {
      envCwd = env.cwd
      return env.cwd
    },
  }

  const model: Model = {
    interpret: async (request) => {
      if (request.context.signs.length === 1) {
        return {
          sign: {
            kind: "AssistantSign",
            content: "",
            toolCalls: [
              {
                id: "call-1",
                name: "env",
                arguments: "{}",
              },
            ],
          },
        }
      }

      return {
        sign: { kind: "AssistantSign", content: "done", toolCalls: [] },
      }
    },
  }

  const state = makeAgentState()
  const signs: Array<Sign> = []
  for await (const sign of agentRun(state, "env", {
    model,
    tools: [tool],
    maxSteps: 4,
    env: { cwd: "/workspace" },
  })) {
    signs.push(sign)
  }

  assert.strictEqual(envCwd, "/workspace")
  assert.deepStrictEqual(signs[1], {
    kind: "ToolSign",
    toolCallId: "call-1",
    content: "/workspace",
  })
})

test("agentRun reports model interpret error", async () => {
  const model: Model = {
    interpret: async () => {
      throw new Error("provider failed")
    },
  }

  const state = makeAgentState()
  const signs: Array<Sign> = []
  for await (const sign of agentRun(state, "hello", {
    model,
    tools: [makeEchoTool()],
    maxSteps: 4,
    env: { cwd: "/workspace" },
  })) {
    signs.push(sign)
  }

  assert.deepStrictEqual(state.context.signs, [
    { kind: "UserSign", content: "hello" },
  ])
  assert.deepStrictEqual(signs, [
    {
      kind: "ErrorSign",
      message: "[agentRun] model interpret failed: provider failed",
    },
  ])
})
