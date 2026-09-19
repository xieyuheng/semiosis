import http from "node:http"
import type { AddressInfo } from "node:net"
import type { FileSystemServerOptions } from "./FileSystemServerOptions.ts"
import { handleFileSystemRequest } from "./handleFileSystemRequest.ts"

export function createFileSystemServer(
  options: FileSystemServerOptions = {},
): http.Server {
  return http.createServer((request, response) => {
    void handleFileSystemRequest(request, response, options).catch((error) => {
      if (response.headersSent) {
        response.end()
        return
      }

      response.statusCode = 500
      response.setHeader("Content-Type", "application/json; charset=utf-8")
      response.end(
        JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : String(error),
          },
        }),
      )
    })
  })
}

export async function startFileSystemServer(
  options: FileSystemServerOptions = {},
): Promise<{ server: http.Server; url: string }> {
  const server = createFileSystemServer(options)
  const host = options.host ?? "127.0.0.1"
  const port = options.port ?? 0

  await listen(server, port, host)

  const address = server.address()
  if (address === null || typeof address === "string") {
    throw new Error(`[startFileSystemServer] invalid address: ${address}`)
  }

  const { port: actualPort } = address as AddressInfo
  const basePath = normalizeBasePath(options.basePath)
  return {
    server,
    url: `http://${host}:${actualPort}${basePath}`,
  }
}

async function listen(
  server: http.Server,
  port: number,
  host: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    function onError(error: Error): void {
      server.off("listening", onListening)
      reject(error)
    }

    function onListening(): void {
      server.off("error", onError)
      resolve()
    }

    server.once("error", onError)
    server.once("listening", onListening)
    server.listen(port, host)
  })
}

function normalizeBasePath(basePath: string | undefined): string {
  if (basePath === undefined || basePath === "" || basePath === "/") return ""
  return `/${basePath.replace(/^\/+|\/+$/g, "")}`
}
