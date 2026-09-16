import type { Tool } from "../tool/Tool.ts"

export function makeEchoTool(): Tool {
  return {
    spec: {
      name: "echo",
      description: "Echo the provided text back to the model.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The text to echo.",
          },
        },
        required: ["text"],
      },
    },
    handler: (_agent, args) => String(args.text ?? ""),
  }
}
