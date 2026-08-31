# @mhdd_24/pgadmin-mcp

MCP server for **PostgreSQL / pgAdmin-style** exploration and SQL from [Cursor](https://cursor.com) (or any MCP client). Follows the same architecture as [flyway-mcp](../flyway-mcp).

Say **"pg status"**, **"list postgres tables"**, or **"run this SQL on Dev"** in chat — the assistant calls the matching tools.

**Full documentation:** [docs/WIKI.md](./docs/WIKI.md)

---

## Tools

| Tool | Role |
|------|------|
| `pg_set_profile` | Sticky session switch: `dev` \| `qa` \| `default` |
| `pg_status` | Sticky + active profile, host, `SELECT 1` |
| `pg_list_databases` | List databases on active (or one-shot) profile server |
| `pg_list_schemas` | List user schemas |
| `pg_list_tables` | List tables/views in a schema |
| `pg_describe_table` | Column metadata |
| `pg_query` | Run SQL (read-only by default) |

### Profiles (no connection details in chat)

1. Put **both** Dev and QA credentials in `mcp.json` (`PG_DEV_*`, `PG_QA_*`).
2. Say **`pgprofile=qa`** or **`pgprofile=dev`** — the assistant calls `pg_set_profile`.
3. Later tools reuse that sticky profile until you switch or the MCP process restarts.
4. Optional one-shot: pass `profile: "qa"` on a single tool without changing sticky.
5. `database` still means the logical DB name on that server (e.g. `transboard`), not the env profile.

---

## Safety

- **Read-only by default** — only `SELECT` / `WITH…SELECT` / `EXPLAIN` / `SHOW` / `VALUES`
- Set `PG_ALLOW_WRITE=true` to allow writes (still subject to DB user privileges)
- `PG_MAX_ROWS` caps returned rows; `PG_QUERY_TIMEOUT_MS` sets statement timeout

---

## Install / run

```bash
cd C:/workspace/pgadmin-mcp
npm install
npm run build
node dist/index.js
```

---

## Cursor `mcp.json`

```json
"pgadmin": {
  "command": "node",
  "args": ["C:/workspace/pgadmin-mcp/dist/index.js"],
  "env": {
    "PG_PROFILE": "dev",
    "PG_DEV_HOST": "192.168.1.141",
    "PG_DEV_PORT": "5432",
    "PG_DEV_USER": "postgres",
    "PG_DEV_PASSWORD": "YOUR_PASSWORD",
    "PG_DEV_DATABASE": "postgres",
    "PG_ALLOW_WRITE": "false",
    "PG_MAX_ROWS": "500"
  }
}
```

Or use discrete `PGHOST` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`, or a single `DATABASE_URL`.

Restart Cursor after saving.

---

## Example prompts

- pgprofile=qa
- pgprofile=dev
- pg status
- list databases
- list tables in schema transc for database transboard
- describe table translations schema transc database transboard
- run: SELECT version();
