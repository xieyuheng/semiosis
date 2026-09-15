import fs from "node:fs"
import Os from "node:os"
import Path from "node:path"
import { z } from "zod"
import type { LlmConfig } from "../llm/Llm.ts"

const deepSeekAuthSchema = z.object({
  type: z.literal("api-key"),
  key: z.string().min(1),
})

const authSchema = z.object({
  deepseek: deepSeekAuthSchema.optional(),
})

export type DeepSeekAuth = z.infer<typeof deepSeekAuthSchema>

export type Auth = z.infer<typeof authSchema>

export function authParse(text: string): Auth {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`[authParse] invalid JSON: ${message}`)
  }

  const result = authSchema.safeParse(value)
  if (!result.success) {
    throw new Error(`[authParse] invalid auth: ${result.error.message}`)
  }

  return result.data
}

export function authRead(path: string = defaultAuthPath()): Auth {
  let text: string
  try {
    text = fs.readFileSync(path, "utf8")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`[authRead] fail to read auth file: ${path}\n  ${message}`)
  }

  return authParse(text)
}

export function authDeepSeekRead(auth: Auth): DeepSeekAuth {
  const deepseek = auth.deepseek
  if (deepseek === undefined) {
    throw new Error("[authDeepSeekRead] auth.deepseek is missing")
  }

  return deepseek
}

export function makeLlmConfig(auth: Auth): LlmConfig {
  const deepseek = authDeepSeekRead(auth)
  return {
    apiKey: deepseek.key,
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-flash",
  }
}

function defaultAuthPath(): string {
  return Path.join(Os.homedir(), ".semiosis", "auth.json")
}
