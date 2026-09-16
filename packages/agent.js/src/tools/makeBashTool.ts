import { spawn } from "node:child_process"
import process from "node:process"
import type { Tool } from "../tool/index.ts"

export type BashToolOptions = {
  description: string
  timeoutMs: number
  maxOutputChars: number
}

const defaultBashToolDescription = `Run commands in a bash shell.
* When invoking this tool, the contents of the "command" parameter does NOT need to be XML-escaped.
* Network access depends on the task environment. Prefer configured mirrors/proxies when they are available.
* Shell state is not persistent across calls. Use \`cd <dir> && <command>\` when you need a specific working directory.
* To inspect a particular line range of a file, e.g. lines 10-25, try 'sed -n 10,25p /path/to/the/file'.
* Please avoid commands that may produce a very large amount of output.`

const defaultBashToolOptions: BashToolOptions = {
  description: defaultBashToolDescription,
  timeoutMs: 300_000,
  maxOutputChars: 200_000,
}

type BashRunOptions = {
  cwd: string
  timeoutMs: number
  maxOutputChars: number
}

type BashRunResult = {
  code: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
  stdoutTruncated: boolean
  stderrTruncated: boolean
  timedOut: boolean
}

export function makeBashTool(
  options: BashToolOptions = defaultBashToolOptions,
): Tool {
  return {
    spec: {
      name: "bash",
      description: options.description,
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The bash command to execute.",
          },
        },
        required: ["command"],
        additionalProperties: false,
      },
    },
    handler: async (agent, args) => {
      const command = args.command
      if (typeof command !== "string") {
        throw new Error("[makeBashTool] command must be a string")
      }

      const result = await bashRun(command, {
        cwd: agent.config.cwd,
        timeoutMs: options.timeoutMs,
        maxOutputChars: options.maxOutputChars,
      })

      return formatBashRunResult(result, options.timeoutMs)
    },
  }
}

function bashRun(
  command: string,
  options: BashRunOptions,
): Promise<BashRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", command], {
      cwd: options.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""
    let stdoutTruncated = false
    let stderrTruncated = false
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      child.kill("SIGKILL")
    }, options.timeoutMs)

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdoutTruncated) return
      const text = chunk.toString("utf8")
      const remaining = options.maxOutputChars - stdout.length
      if (text.length > remaining) {
        stdout += text.slice(0, Math.max(remaining, 0))
        stdoutTruncated = true
      } else {
        stdout += text
      }
    })

    child.stderr.on("data", (chunk: Buffer) => {
      if (stderrTruncated) return
      const text = chunk.toString("utf8")
      const remaining = options.maxOutputChars - stderr.length
      if (text.length > remaining) {
        stderr += text.slice(0, Math.max(remaining, 0))
        stderrTruncated = true
      } else {
        stderr += text
      }
    })

    child.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })

    child.on("close", (code, signal) => {
      clearTimeout(timer)
      resolve({
        code,
        signal,
        stdout,
        stderr,
        stdoutTruncated,
        stderrTruncated,
        timedOut,
      })
    })
  })
}

function formatBashRunResult(result: BashRunResult, timeoutMs: number): string {
  const lines: Array<string> = []

  if (result.timedOut) {
    lines.push("exit_code: timeout")
    lines.push(`timeout_ms: ${timeoutMs}`)
  } else {
    lines.push(`exit_code: ${result.code ?? result.signal ?? "unknown"}`)
  }

  lines.push("stdout:")
  lines.push(truncatedText(result.stdout, result.stdoutTruncated))

  if (result.stderr !== "" || result.stderrTruncated) {
    lines.push("stderr:")
    lines.push(truncatedText(result.stderr, result.stderrTruncated))
  }

  return lines.join("\n")
}

function truncatedText(text: string, truncated: boolean): string {
  if (!truncated) return text
  return `${text}\n[output truncated]`
}
