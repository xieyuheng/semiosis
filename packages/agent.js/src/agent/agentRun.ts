import {
  ErrorSign,
  UserSign,
  isAssistantSign,
  isErrorSign,
  type Sign,
} from "../sign/index.ts"
import { toolCallRun } from "../tool/index.ts"
import type { Agent } from "./Agent.ts"

export async function* agentRun(
  agent: Agent,
  input: string,
): AsyncGenerator<Sign> {
  const userSign = UserSign(input)
  agent.context.signs.push(userSign)

  let step = 0
  while (true) {
    if (step >= agent.config.maxSteps) {
      yield ErrorSign(`[agentRun] max steps reached: ${agent.config.maxSteps}`)
      return
    }

    step += 1

    const output = await agent.model.interpret({
      context: agent.context,
      tools: agent.config.tools.map((tool) => tool.spec),
    })

    const sign = output.sign

    if (isErrorSign(sign)) {
      yield sign
      return
    }

    if (!isAssistantSign(sign)) {
      yield ErrorSign(`[agentRun] unexpected model output sign: ${sign.kind}`)
      return
    }

    agent.context.signs.push(sign)
    yield sign

    if (sign.toolCalls.length === 0) {
      return
    }

    for (const toolCall of sign.toolCalls) {
      const toolSign = await toolCallRun(toolCall, agent)

      if (isErrorSign(toolSign)) {
        yield toolSign
        return
      }

      agent.context.signs.push(toolSign)
      yield toolSign
    }
  }
}
