import assert from "node:assert"
import { test } from "node:test"
import type { Model } from "../model/Model.ts"
import { ErrorSign, type Sign } from "../sign/index.ts"
import type { Tool } from "../tool/Tool.ts"
import { makeEchoTool } from "../tools/index.ts"
import { agentRun, makeAgent } from "./index.ts"

test("agentRun runs tool calls and returns final answer", async () => {
  const inputs: Array<Array<Sign>> = []
  const model: Model = {
    interpret: async (input) => {
      inputs.push(input.context.signs)
      if (input.context.signs.length === 1) {
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

  const agent = makeAgent(model, {
    cwd: "/workspace",
    tools: [makeEchoTool()],
    maxSteps: 4,
  })
  const signs: Array<Sign> = []
  for await (const sign of agentRun(agent, "use echo")) {
    signs.push(sign)
  }

  assert.deepStrictEqual(agent.context.signs, [
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
    interpret: async (input) => {
      toolNames = input.tools.map((tool) => tool.name)
      return {
        sign: { kind: "AssistantSign", content: "done", toolCalls: [] },
      }
    },
  }

  const agent = makeAgent(model, {
    cwd: "/workspace",
    tools: [makeEchoTool()],
    maxSteps: 1,
  })
  for await (const _sign of agentRun(agent, "hello")) {
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

  const agent = makeAgent(model, {
    cwd: "/workspace",
    tools: [makeEchoTool()],
    maxSteps: 1,
  })
  const signs: Array<Sign> = []
  for await (const sign of agentRun(agent, "loop")) {
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
    interpret: async (input) => {
      if (input.context.signs.length === 1) {
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

  const agent = makeAgent(model, {
    cwd: "/workspace",
    tools: [makeEchoTool()],
    maxSteps: 4,
  })
  const signs: Array<Sign> = []
  for await (const sign of agentRun(agent, "break tools")) {
    signs.push(sign)
  }

  assert.deepStrictEqual(agent.context.signs[2], {
    kind: "ToolSign",
    toolCallId: "call-1",
    content: "[agentRun] unknown tool: missing",
  })

  const toolSign = agent.context.signs[3]
  assert.strictEqual(toolSign.kind, "ToolSign")
  if (toolSign.kind !== "ToolSign") {
    throw new Error("expected ToolSign")
  }
  assert.strictEqual(toolSign.toolCallId, "call-2")
  assert.match(toolSign.content, /invalid arguments for tool echo/)

  assert.deepStrictEqual(agent.context.signs[4], {
    kind: "AssistantSign",
    content: "fixed",
    toolCalls: [],
  })
})

test("agentRun passes agent to tool handler", async () => {
  let envCwd = ""
  const tool: Tool = {
    spec: {
      name: "env",
      description: "Read agent.config.cwd.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    handler: (agent) => {
      envCwd = agent.config.cwd
      return agent.config.cwd
    },
  }

  const model: Model = {
    interpret: async (input) => {
      if (input.context.signs.length === 1) {
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

  const agent = makeAgent(model, {
    cwd: "/workspace",
    tools: [tool],
    maxSteps: 4,
  })
  const signs: Array<Sign> = []
  for await (const sign of agentRun(agent, "env")) {
    signs.push(sign)
  }

  assert.strictEqual(envCwd, "/workspace")
  assert.deepStrictEqual(signs[1], {
    kind: "ToolSign",
    toolCallId: "call-1",
    content: "/workspace",
  })
})

test("agentRun reports model output error sign", async () => {
  const model: Model = {
    interpret: async () => ({
      sign: ErrorSign("provider failed"),
    }),
  }

  const agent = makeAgent(model, {
    cwd: "/workspace",
    tools: [makeEchoTool()],
    maxSteps: 4,
  })
  const signs: Array<Sign> = []
  for await (const sign of agentRun(agent, "hello")) {
    signs.push(sign)
  }

  assert.deepStrictEqual(agent.context.signs, [
    { kind: "UserSign", content: "hello" },
  ])
  assert.deepStrictEqual(signs, [ErrorSign("provider failed")])
})
