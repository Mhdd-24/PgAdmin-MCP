import { z } from 'zod';

/** Shared Zod field: sticky/one-shot env profile without typing host/password in chat. */
export const profileArg = z
  .string()
  .optional()
  .describe(
    'Connection profile: "dev" | "qa" | "default". ' +
      'Uses credentials from mcp.json (PG_DEV_* / PG_QA_*). ' +
      'Omit to use the sticky session profile from pg_set_profile / PG_PROFILE.',
  );

export const PROFILE_HELP =
  'Profiles: dev → PG_DEV_* (Development), qa → PG_QA_* (QA). ' +
  'Say "pgprofile=qa" or call pg_set_profile — no host/password in chat.';
