import fs from "node:fs"
import Os from "node:os"
import Path from "node:path"
import { parseDeepSeekModelConfig } from "./parseDeepSeekModelConfig.ts"
import type { DeepSeekModelConfig } from "./DeepSeekModelConfig.ts"

export function readDeepSeekModelConfig(name: string): DeepSeekModelConfig {
  const path = deepSeekModelConfigPath(name)
  const text = readDeepSeekModelConfigFile(path)
  return parseDeepSeekModelConfig(name, text)
}

function deepSeekModelConfigPath(name: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`[readDeepSeekModelConfig] invalid model name: ${name}`)
  }

  return Path.join(
    Os.homedir(),
    ".semiosis",
    "database",
    "models",
    "deepseek",
    `${name}.json`,
  )
}

function readDeepSeekModelConfigFile(path: string): string {
  try {
    return fs.readFileSync(path, "utf8")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[readDeepSeekModelConfigFile] fail to read model config: ${path}\n  ${message}`,
    )
  }
}
