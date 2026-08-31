# pgAdmin MCP — Project Wiki

Guide for **@mhdd_24/pgadmin-mcp**: PostgreSQL query / explore MCP aligned with the flyway-mcp architecture.

---

## 1. What this project does

Lets the AI assistant connect to PostgreSQL (Dev/QA profiles) and:

- Check connectivity
- List databases, schemas, tables/views
- Describe columns
- Run SQL (read-only by default)

---

## 2. Architecture

```
MCP client (stdio)
    → src/index.ts (McpServer + registerTools)
        → tools/* (thin Zod + toolText/toolError)
            → services/pgQueryService + pgClient (pg Pool)
        → config/pgadmin.config.ts (PG constants)
        → env.ts (profiles + safety flags)
```

Same layering as flyway-mcp: **entry → env/config → tools → services → utils**.

---

## 3. Configuration

| Variable | Purpose |
|----------|---------|
| `PG_PROFILE` | `dev` \| `qa` \| omit for default `PGHOST`… fields |
| `PG_DEV_*` / `PG_QA_*` | Host, port, user, password, database per profile |
| `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | Default connection |
| `DATABASE_URL` | Optional full URL (used when no per-call database override) |
| `PG_ALLOW_WRITE` | `true` to allow non-SELECT SQL |
| `PG_QUERY_TIMEOUT_MS` | Statement timeout (default 30000) |
| `PG_MAX_ROWS` | Max rows returned (default 500) |

---

## 4. Tools

| Name | Args |
|------|------|
| `pg_set_profile` | `profile` (required), `verify?` |
| `pg_status` | `database?`, `profile?` |
| `pg_list_databases` | `profile?` |
| `pg_list_schemas` | `database?`, `profile?` |
| `pg_list_tables` | `schema?`, `database?`, `profile?` |
| `pg_describe_table` | `table`, `schema?`, `database?`, `profile?` |
| `pg_query` | `sql`, `database?`, `maxRows?`, `profile?` |

### Sticky session profiles

| Concept | Behavior |
|---------|----------|
| Startup | `PG_PROFILE` from mcp.json / `.env` |
| Sticky | `pg_set_profile` — used by all later tools |
| One-shot | Optional `profile` on a tool — does not change sticky |
| Logical DB | `database` arg = DB name on that server (e.g. `transboard`) |

Chat: `pgprofile=qa` → `pg_set_profile({ profile: "qa" })` → no host/password in the conversation.


---

## 5. Local development

```bash
npm install
npm run dev      # tsx
npm run build
npm start
```

Never commit `.env`. Use `.env.example` as a template.

---

## 6. Troubleshooting

| Symptom | Check |
|---------|--------|
| Connection refused / timeout | VPN (NetExtender), host/port, firewall |
| password authentication failed | `PG_*_PASSWORD` / user |
| Write SQL blocked | Set `PG_ALLOW_WRITE=true` if intentional |
| Empty schema list | Wrong database — pass `database` on the tool |
| Output truncated | Raise `PG_MAX_ROWS` or narrow the query |

---

## 7. Organized reference (Sublime)

Human-readable mirrors (same pattern as Flyway / Sublime MCP guides):

| File | Purpose |
|------|---------|
| `./docs/usage-guide.txt` | Chat phrases + tools + env |
| `…/MCP/Cursor-mcp-json-Configuration.txt` | Redacted `mcp.json` snapshot (includes `pgadmin`) |
| `…/MCP/Quick-Reference-All-Servers.txt` | All MCP one-liners |
| `…/Database/PostgreSQL-Dev-Connection.txt` | Dev host credentials + MCP profile |
| `…/Database/PostgreSQL-QA-Connection.txt` | QA host credentials + MCP profile |

Live Cursor config: `%USERPROFILE%/.cursor/mcp.json` → server key `pgadmin`.
