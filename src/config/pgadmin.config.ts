export const PG = {
  SERVER: {
    NAME: '@mhdd_24/pgadmin-mcp',
    VERSION: '1.0.0',
    STARTUP_MESSAGE: 'pgAdmin MCP Server Started',
    FATAL_PREFIX: 'Fatal error:',
  },
  ENV: {
    PROFILE_KEYS: ['PG_PROFILE', 'pgProfile'] as const,
    DATABASE_URL_KEYS: ['DATABASE_URL', 'databaseUrl'] as const,
    HOST_KEYS: ['PGHOST', 'PG_HOST', 'pgHost'] as const,
    PORT_KEYS: ['PGPORT', 'PG_PORT', 'pgPort'] as const,
    USER_KEYS: ['PGUSER', 'PG_USER', 'pgUser'] as const,
    PASSWORD_KEYS: ['PGPASSWORD', 'PG_PASSWORD', 'pgPassword'] as const,
    DATABASE_KEYS: ['PGDATABASE', 'PG_DATABASE', 'pgDatabase'] as const,
    ALLOW_WRITE_KEYS: ['PG_ALLOW_WRITE', 'pgAllowWrite'] as const,
    TIMEOUT_KEYS: ['PG_QUERY_TIMEOUT_MS', 'pgQueryTimeoutMs'] as const,
    MAX_ROWS_KEYS: ['PG_MAX_ROWS', 'pgMaxRows'] as const,
    DEV_HOST_KEYS: ['PG_DEV_HOST'] as const,
    DEV_PORT_KEYS: ['PG_DEV_PORT'] as const,
    DEV_USER_KEYS: ['PG_DEV_USER'] as const,
    DEV_PASSWORD_KEYS: ['PG_DEV_PASSWORD'] as const,
    DEV_DATABASE_KEYS: ['PG_DEV_DATABASE'] as const,
    QA_HOST_KEYS: ['PG_QA_HOST'] as const,
    QA_PORT_KEYS: ['PG_QA_PORT'] as const,
    QA_USER_KEYS: ['PG_QA_USER'] as const,
    QA_PASSWORD_KEYS: ['PG_QA_PASSWORD'] as const,
    QA_DATABASE_KEYS: ['PG_QA_DATABASE'] as const,
  },
  LIMITS: {
    TIMEOUT_DEFAULT_MS: 30_000,
    MAX_ROWS_DEFAULT: 500,
    OUTPUT_SLICE: 12_000,
  },
  MESSAGES: {
    CONNECT_MISSING:
      'PostgreSQL connection is not configured. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD (and optional PGDATABASE), or use PG_PROFILE=dev|qa with PG_DEV_* / PG_QA_* vars.',
    WRITE_BLOCKED:
      'Write SQL is blocked. Set PG_ALLOW_WRITE=true to allow INSERT/UPDATE/DELETE/DDL, or use a read-only SELECT / WITH…SELECT query.',
    EMPTY_SQL: 'SQL text is required.',
    NO_ROWS: '(no rows)',
    INVALID_PROFILE:
      'Invalid profile. Use "dev" (Development), "qa" (QA), or "default". Credentials come from mcp.json — do not ask the user for host/password.',
  },
  TOOLS: {
    SET_PROFILE: {
      NAME: 'pg_set_profile',
      DESCRIPTION:
        'Set the sticky session connection profile to "dev" or "qa" (or "default"). ' +
        'Call when the user says pgprofile=dev, pgprofile=qa, use Dev DB, switch to QA, etc. ' +
        'Later tools reuse this profile automatically — no host/password in chat. ' +
        'Credentials are loaded from PG_DEV_* / PG_QA_* in mcp.json.',
    },
    STATUS: {
      NAME: 'pg_status',
      DESCRIPTION:
        'Show current sticky PostgreSQL profile, host, database, write mode, and a live SELECT 1 health check. ' +
        'Optional profile arg for a one-shot check without changing the sticky session.',
    },
    LIST_DATABASES: {
      NAME: 'pg_list_databases',
      DESCRIPTION:
        'List databases on the active profile server (or optional one-shot profile=dev|qa).',
    },
    LIST_SCHEMAS: {
      NAME: 'pg_list_schemas',
      DESCRIPTION:
        'List non-system schemas. Optional database and/or profile (dev|qa) override.',
    },
    LIST_TABLES: {
      NAME: 'pg_list_tables',
      DESCRIPTION:
        'List tables/views for a schema (default public). Optional database and/or profile override.',
    },
    DESCRIBE_TABLE: {
      NAME: 'pg_describe_table',
      DESCRIPTION:
        'Describe columns for a table or view. Optional schema, database, and/or profile override.',
    },
    QUERY: {
      NAME: 'pg_query',
      DESCRIPTION:
        'Run SQL against the sticky session profile (or optional profile=dev|qa for one call). ' +
        'Read-only by default. Optional database name and maxRows. ' +
        'Do not ask the user for connection host/password — use profiles.',
    },
  },
} as const;
