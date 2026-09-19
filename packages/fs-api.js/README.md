# fs-api.js

A JSON-RPC-style local file system API over HTTP.

The server exposes one `POST` endpoint per function.
The client wraps the endpoints into a typed JavaScript interface.

## API

| endpoint | request body | response |
| --- | --- | --- |
| `exists` | `{ path }` | `boolean` |
| `is-file` | `{ path }` | `boolean` |
| `is-directory` | `{ path }` | `boolean` |
| `read` | `{ path }` | `string` |
| `write` | `{ path, text }` | `null` |
| `list` | `{ path }` | `Array<string>` |
| `list-recursive` | `{ path }` | `Array<string>` |
| `ensure-file` | `{ path }` | `null` |
| `ensure-directory` | `{ path }` | `null` |
| `delete-file` | `{ path }` | `null` |
| `delete-directory` | `{ path }` | `null` |
| `delete` | `{ path }` | `null` |
| `rename` | `{ path, newPath }` | `null` |

## Server

```typescript
import { startFileSystemServer } from "@xieyuheng/fs-api.js"

const { server, url } = await startFileSystemServer({
  host: "127.0.0.1",
  port: 3000,
  basePath: "/fs",
  corsOrigin: "http://localhost:5173",
})
```

## Client

```typescript
import { makeFileSystemClient } from "@xieyuheng/fs-api.js"

const fs = makeFileSystemClient({ baseUrl: "http://127.0.0.1:3000/fs" })

await fs.write("/tmp/a.md", "# Hello")
console.log(await fs.read("/tmp/a.md"))
```
