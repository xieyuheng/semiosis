import type { IncomingMessage, ServerResponse } from "node:http"
import * as service from "../service/index.ts"
import type { FileSystemServerOptions } from "./FileSystemServerOptions.ts"
import { HttpError } from "./HttpError.ts"

type Handler = (body: unknown) => Promise<unknown>

const handlers: Record<string, Handler> = {
  exists: async (body) => service.exists(readPath(body)),
  "is-file": async (body) => service.isFile(readPath(body)),
  "is-directory": async (body) => service.isDirectory(readPath(body)),
  read: async (body) => service.read(readPath(body)),
  write: async (body) => service.write(readPath(body), readText(body)),
  list: async (body) => service.list(readPath(body)),
  "list-recursive": async (body) => service.listRecursive(readPath(body)),
  "ensure-file": async (body) => service.ensureFile(readPath(body)),
  "ensure-directory": async (body) => service.ensureDirectory(readPath(body)),
  "delete-file": async (body) => service.deleteFile(readPath(body)),
  "delete-directory": async (body) => service.deleteDirectory(readPath(body)),
  delete: async (body) => service.remove(readPath(body)),
  rename: async (body) => service.rename(readPath(body), readNewPath(body)),
}

export async function handleFileSystemRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: FileSystemServerOptions = {},
): Promise<void> {
  setCorsHeaders(response, options.corsOrigin)

  if (request.method === "OPTIONS") {
    response.statusCode = 204
    response.end()
    return
  }

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, `method not allowed: ${request.method}`)
    }

    const method = readMethodName(request.url, options.basePath)
    const handler = handlers[method]
    if (handler === undefined) {
      throw new HttpError(404, `unknown method: ${method}`)
    }

    const body = await readJsonBody(request)
    const result = await handler(body)
    sendJson(response, 200, result)
  } catch (error) {
    sendError(response, error)
  }
}

function readMethodName(
  url: string | undefined,
  basePath: string | undefined,
): string {
  const parsed = new URL(url ?? "/", "http://localhost")
  const normalizedBasePath = normalizeBasePath(basePath)
  const pathname = parsed.pathname

  if (!pathname.startsWith(normalizedBasePath)) {
    throw new HttpError(404, `unknown path: ${pathname}`)
  }

  return pathname.slice(normalizedBasePath.length).replace(/^\/+/, "")
}

function normalizeBasePath(basePath: string | undefined): string {
  if (basePath === undefined || basePath === "" || basePath === "/") return ""
  return `/${basePath.replace(/^\/+|\/+$/g, "")}`
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Array<Buffer> = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  if (chunks.length === 0) return {}

  const text = Buffer.concat(chunks).toString("utf8")
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, "invalid JSON body")
  }
}

function readPath(body: unknown): string {
  const record = readRecord(body)
  const path = record.path
  if (typeof path !== "string") {
    throw new HttpError(400, "field `path` must be a string")
  }
  return path
}

function readText(body: unknown): string {
  const record = readRecord(body)
  const text = record.text
  if (typeof text !== "string") {
    throw new HttpError(400, "field `text` must be a string")
  }
  return text
}

function readNewPath(body: unknown): string {
  const record = readRecord(body)
  const newPath = record.newPath
  if (typeof newPath !== "string") {
    throw new HttpError(400, "field `newPath` must be a string")
  }
  return newPath
}

function readRecord(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "request body must be a JSON object")
  }
  return body as Record<string, unknown>
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  value: unknown,
): void {
  response.statusCode = statusCode
  response.setHeader("Content-Type", "application/json; charset=utf-8")
  response.end(JSON.stringify(value ?? null))
}

function sendError(response: ServerResponse, error: unknown): void {
  const httpError = error instanceof HttpError ? error : undefined
  const statusCode = httpError?.statusCode ?? statusCodeFromError(error)
  const code = httpError?.code ?? readErrorCode(error)
  const message = error instanceof Error ? error.message : String(error)

  if (response.headersSent) {
    response.end()
    return
  }

  sendJson(response, statusCode, {
    error: {
      code,
      message,
    },
  })
}

function statusCodeFromError(error: unknown): number {
  const code = readErrorCode(error)
  switch (code) {
    case "ENOENT":
      return 404
    case "EACCES":
    case "EPERM":
      return 403
    case "EEXIST":
    case "ENOTEMPTY":
      return 409
    default:
      return 500
  }
}

function readErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined
  return (error as NodeJS.ErrnoException).code
}

function setCorsHeaders(
  response: ServerResponse,
  origin: string | undefined,
): void {
  if (origin === undefined) return

  response.setHeader("Access-Control-Allow-Origin", origin)
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  response.setHeader("Access-Control-Allow-Headers", "Content-Type")
}
