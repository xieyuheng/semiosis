import fs from "node:fs"
import Os from "node:os"
import Path from "node:path"
import { parseDeepSeekProvider } from "./parseDeepSeekProvider.ts"
import type { DeepSeekProvider } from "./DeepSeekProvider.ts"

export function readDeepSeekProvider(): DeepSeekProvider {
  const path = deepSeekProviderPath()
  const text = deepSeekTextRead(path)
  return parseDeepSeekProvider(text)
}

function deepSeekProviderPath(): string {
  return Path.join(
    Os.homedir(),
    ".semiosis",
    "database",
    "providers",
    "deepseek.json",
  )
}

function deepSeekTextRead(path: string): string {
  try {
    return fs.readFileSync(path, "utf8")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[readDeepSeekProvider] fail to read provider file: ${path}\n  ${message}`,
    )
  }
}
