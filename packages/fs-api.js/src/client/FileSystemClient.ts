export type FileSystemClient = {
  exists(path: string): Promise<boolean>
  isFile(path: string): Promise<boolean>
  isDirectory(path: string): Promise<boolean>
  read(path: string): Promise<string>
  write(path: string, text: string): Promise<void>
  list(path: string): Promise<Array<string>>
  listRecursive(path: string): Promise<Array<string>>
  ensureFile(path: string): Promise<void>
  ensureDirectory(path: string): Promise<void>
  deleteFile(path: string): Promise<void>
  deleteDirectory(path: string): Promise<void>
  delete(path: string): Promise<void>
  rename(path: string, newPath: string): Promise<void>
}

export type FileSystemClientConfig = {
  baseUrl: string
}

export function makeFileSystemClient(
  config: FileSystemClientConfig,
): FileSystemClient {
  return {
    exists: (path) => call(config.baseUrl, "exists", { path }),
    isFile: (path) => call(config.baseUrl, "is-file", { path }),
    isDirectory: (path) => call(config.baseUrl, "is-directory", { path }),
    read: (path) => call(config.baseUrl, "read", { path }),
    write: async (path, text) => {
      await call(config.baseUrl, "write", { path, text })
    },
    list: (path) => call(config.baseUrl, "list", { path }),
    listRecursive: (path) => call(config.baseUrl, "list-recursive", { path }),
    ensureFile: async (path) => {
      await call(config.baseUrl, "ensure-file", { path })
    },
    ensureDirectory: async (path) => {
      await call(config.baseUrl, "ensure-directory", { path })
    },
    deleteFile: async (path) => {
      await call(config.baseUrl, "delete-file", { path })
    },
    deleteDirectory: async (path) => {
      await call(config.baseUrl, "delete-directory", { path })
    },
    delete: async (path) => {
      await call(config.baseUrl, "delete", { path })
    },
    rename: async (path, newPath) => {
      await call(config.baseUrl, "rename", { path, newPath })
    },
  }
}

async function call<T>(
  baseUrl: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(joinUrl(baseUrl, method), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()
  const value = text === "" ? null : parseJson(text)

  if (!response.ok) {
    throw new Error(
      `[FileSystemClient] ${method} failed with HTTP ${response.status}: ${readErrorMessage(value, text)}`,
    )
  }

  return value as T
}

function joinUrl(baseUrl: string, method: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${method}`
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`[FileSystemClient] invalid JSON response: ${text}`)
  }
}

function readErrorMessage(value: unknown, fallback: string): string {
  if (value !== null && typeof value === "object" && "error" in value) {
    const error = (value as { error?: unknown }).error
    if (error !== null && typeof error === "object" && "message" in error) {
      const message = (error as { message?: unknown }).message
      if (typeof message === "string") return message
    }
  }

  return fallback
}
