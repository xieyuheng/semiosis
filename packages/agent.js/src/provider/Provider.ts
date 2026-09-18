import fs from "node:fs"
import Os from "node:os"
import Path from "node:path"
import { z } from "zod"

const providerSchema = z.object({
  type: z.literal("api-key"),
  key: z.string().min(1),
})

export type Provider = z.infer<typeof providerSchema>

export function providerParse(text: string): Provider {
  const value = providerJsonParse(text)
  const result = providerSchema.safeParse(value)
  if (!result.success) {
    throw new Error(`[providerParse] invalid provider: ${result.error.message}`)
  }

  return result.data
}

export function providerRead(name: string): Provider {
  const path = providerPath(name)
  const text = providerTextRead(path)
  return providerParse(text)
}

function providerJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`[providerParse] invalid JSON: ${message}`)
  }
}

function providerTextRead(path: string): string {
  try {
    return fs.readFileSync(path, "utf8")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[providerRead] fail to read provider file: ${path}\n  ${message}`,
    )
  }
}

function providerPath(name: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`[providerPath] invalid provider name: ${name}`)
  }

  return Path.join(
    Os.homedir(),
    ".semiosis",
    "database",
    "providers",
    `${name}.json`,
  )
}
