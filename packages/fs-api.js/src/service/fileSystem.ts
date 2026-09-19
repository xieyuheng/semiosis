import fs from "node:fs/promises"
import Path from "node:path"

export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch (error) {
    if (isNotFoundError(error)) return false
    throw error
  }
}

export async function isFile(path: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path)
    return stat.isFile()
  } catch (error) {
    if (isNotFoundError(error)) return false
    throw error
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path)
    return stat.isDirectory()
  } catch (error) {
    if (isNotFoundError(error)) return false
    throw error
  }
}

export async function read(path: string): Promise<string> {
  return await fs.readFile(path, "utf8")
}

export async function write(path: string, text: string): Promise<void> {
  await fs.writeFile(path, text, "utf8")
}

export async function list(path: string): Promise<Array<string>> {
  const names = await fs.readdir(path)
  return names.sort().map((name) => Path.join(path, name))
}

export async function listRecursive(path: string): Promise<Array<string>> {
  const output: Array<string> = []
  await visit(path)
  return output

  async function visit(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name))

    for (const entry of entries) {
      const childPath = Path.join(currentPath, entry.name)
      output.push(childPath)
      if (entry.isDirectory()) {
        await visit(childPath)
      }
    }
  }
}

export async function ensureFile(path: string): Promise<void> {
  await fs.mkdir(Path.dirname(path), { recursive: true })
  const file = await fs.open(path, "a")
  await file.close()
}

export async function ensureDirectory(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true })
}

export async function deleteFile(path: string): Promise<void> {
  await fs.unlink(path)
}

export async function deleteDirectory(path: string): Promise<void> {
  await fs.rmdir(path)
}

export async function remove(path: string): Promise<void> {
  await fs.rm(path, { recursive: true })
}

export { remove as delete }

export async function rename(path: string, newPath: string): Promise<void> {
  await fs.rename(path, newPath)
}

export function isNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const code = (error as NodeJS.ErrnoException).code
  return code === "ENOENT" || code === "ENOTDIR"
}
