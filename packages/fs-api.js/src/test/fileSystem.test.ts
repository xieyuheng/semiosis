import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { makeFileSystemClient, startFileSystemServer } from "../index.ts"

test("fileSystem client and server", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-fs-"))
  const { server, url } = await startFileSystemServer({ basePath: "/fs" })
  const client = makeFileSystemClient({ baseUrl: url })

  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await fs.rm(root, { recursive: true, force: true })
  })

  assert.equal(await client.exists(root), true)
  assert.equal(await client.isDirectory(root), true)
  assert.equal(await client.isFile(root), false)

  const textFile = Path.join(root, "notes", "a.md")
  assert.equal(await client.exists(textFile), false)

  await client.ensureFile(textFile)
  assert.equal(await client.exists(textFile), true)
  assert.equal(await client.isFile(textFile), true)

  await client.write(textFile, "# Hello")
  assert.equal(await client.read(textFile), "# Hello")

  const emptyFile = Path.join(root, "empty.txt")
  await client.ensureFile(emptyFile)
  assert.equal(await client.read(emptyFile), "")

  await client.ensureDirectory(Path.join(root, "empty-dir"))
  assert.deepEqual(await client.list(Path.join(root, "empty-dir")), [])

  assert.deepEqual(await client.list(Path.join(root, "notes")), [textFile])

  const listRoot = await client.list(root)
  assert.deepEqual(listRoot, [
    Path.join(root, "empty-dir"),
    emptyFile,
    Path.join(root, "notes"),
  ])

  const recursive = await client.listRecursive(root)
  assert.deepEqual(recursive, [
    Path.join(root, "empty-dir"),
    emptyFile,
    Path.join(root, "notes"),
    textFile,
  ])

  const renamedFile = Path.join(root, "renamed.md")
  await client.rename(textFile, renamedFile)
  assert.equal(await client.exists(textFile), false)
  assert.equal(await client.read(renamedFile), "# Hello")

  await client.deleteFile(renamedFile)
  assert.equal(await client.exists(renamedFile), false)

  await client.deleteDirectory(Path.join(root, "empty-dir"))
  assert.equal(await client.exists(Path.join(root, "empty-dir")), false)

  await client.delete(Path.join(root, "notes"))
  assert.equal(await client.exists(Path.join(root, "notes")), false)
})
