# aikido-firewall-demo

A deliberately vulnerable Express app protected by [Aikido's Zen firewall](https://github.com/AikidoSec/firewall-node).

The app has real SQL injection and path traversal vulnerabilities. Aikido's runtime firewall catches attacks at the sink level — intercepting dangerous operations (file reads, path normalization) when user-controlled input flows into them.

## What it demonstrates

| Endpoint | Vulnerability | Aikido blocks? |
|---|---|---|
| `GET /search?q=...` | SQL injection via string interpolation into SQLite | No — `better-sqlite3` not in instrumented sinks |
| `GET /file?name=...` | Path traversal via `path.join` with user input | **Yes** — catches `../` escape via `path.normalize` hook |
| `POST /login` | SQL injection via POST body | No — same `better-sqlite3` gap |

## Run

```bash
npm install
AIKIDO_BLOCK=true node --require @aikidosec/firewall/instrument server.js
```

Then test:

```bash
# Normal request (passes)
curl "http://localhost:3001/search?q=alice"

# Path traversal (blocked by Aikido)
curl "http://localhost:3001/file?name=../../../etc/passwd"
```

## Findings

1. **Path traversal detection works** — Aikido intercepts `path.normalize()` and throws when user input would escape the intended directory.
2. **Framework detection gap** — Aikido warns "no supported web framework" on Express 4.22 with Node 26. This may affect SQL injection detection, which needs request context to correlate user input with database queries.
3. **`better-sqlite3` not instrumented** — SQL injection through this driver isn't caught. The firewall likely covers `mysql2`, `pg`, and `mongodb`.

## License

MIT
