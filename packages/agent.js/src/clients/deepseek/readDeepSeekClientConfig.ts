import fs from "node:fs"
import Os from "node:os"
import Path from "node:path"
import type { DeepSeekClientConfig } from "./DeepSeekClientConfig.ts"
import { parseDeepSeekClientConfig } from "./parseDeepSeekClientConfig.ts"

export function readDeepSeekClientConfig(): DeepSeekClientConfig {
  const path = deepSeekClientConfigPath()
  const text = deepSeekConfigTextRead(path)
  return parseDeepSeekClientConfig(text)
}

function deepSeekClientConfigPath(): string {
  return Path.join(
    Os.homedir(),
    ".semiosis",
    "database",
    "providers",
    "deepseek.json",
  )
}

function deepSeekConfigTextRead(path: string): string {
  try {
    return fs.readFileSync(path, "utf8")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[readDeepSeekClientConfig] fail to read provider file: ${path}\n  ${message}`,
    )
  }
}
