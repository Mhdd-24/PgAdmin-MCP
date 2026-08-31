import dotenv from 'dotenv';
import { PG } from './config/pgadmin.config.js';

dotenv.config();

function readEnv(keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value?.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readInt(keys: readonly string[], fallback: number): number {
  const raw = readEnv(keys);
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBool(keys: readonly string[], fallback: boolean): boolean {
  const raw = readEnv(keys)?.toLowerCase();
  if (!raw) {
    return fallback;
  }
  if (['1', 'true', 'yes', 'on'].includes(raw)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(raw)) {
    return false;
  }
  return fallback;
}

export type PgProfileName = 'default' | 'dev' | 'qa';

export interface PgConnectionConfig {
  profile: PgProfileName;
  connectionString?: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function parseProfileName(raw?: string | null): PgProfileName | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'dev' || normalized === 'development') {
    return 'dev';
  }
  if (normalized === 'qa' || normalized === 'quality' || normalized === 'uat') {
    return 'qa';
  }
  if (normalized === 'default' || normalized === 'local') {
    return 'default';
  }
  return undefined;
}

function resolveStartupProfile(): PgProfileName {
  return parseProfileName(readEnv(PG.ENV.PROFILE_KEYS)) ?? 'default';
}

/** Build connection settings for a named profile from process env (no secrets in chat). */
export function buildConnectionForProfile(profile: PgProfileName): PgConnectionConfig {
  const connectionString = readEnv(PG.ENV.DATABASE_URL_KEYS);

  if (profile === 'dev') {
    return {
      profile,
      connectionString: undefined,
      host: readEnv(PG.ENV.DEV_HOST_KEYS) ?? readEnv(PG.ENV.HOST_KEYS) ?? 'localhost',
      port: readInt(PG.ENV.DEV_PORT_KEYS, readInt(PG.ENV.PORT_KEYS, 5432)),
      user: readEnv(PG.ENV.DEV_USER_KEYS) ?? readEnv(PG.ENV.USER_KEYS) ?? 'postgres',
      password: readEnv(PG.ENV.DEV_PASSWORD_KEYS) ?? readEnv(PG.ENV.PASSWORD_KEYS) ?? '',
      database: readEnv(PG.ENV.DEV_DATABASE_KEYS) ?? readEnv(PG.ENV.DATABASE_KEYS) ?? 'postgres',
    };
  }

  if (profile === 'qa') {
    return {
      profile,
      connectionString: undefined,
      host: readEnv(PG.ENV.QA_HOST_KEYS) ?? readEnv(PG.ENV.HOST_KEYS) ?? 'localhost',
      port: readInt(PG.ENV.QA_PORT_KEYS, readInt(PG.ENV.PORT_KEYS, 5432)),
      user: readEnv(PG.ENV.QA_USER_KEYS) ?? readEnv(PG.ENV.USER_KEYS) ?? 'postgres',
      password: readEnv(PG.ENV.QA_PASSWORD_KEYS) ?? readEnv(PG.ENV.PASSWORD_KEYS) ?? '',
      database: readEnv(PG.ENV.QA_DATABASE_KEYS) ?? readEnv(PG.ENV.DATABASE_KEYS) ?? 'postgres',
    };
  }

  return {
    profile: 'default',
    connectionString,
    host: readEnv(PG.ENV.HOST_KEYS) ?? 'localhost',
    port: readInt(PG.ENV.PORT_KEYS, 5432),
    user: readEnv(PG.ENV.USER_KEYS) ?? 'postgres',
    password: readEnv(PG.ENV.PASSWORD_KEYS) ?? '',
    database: readEnv(PG.ENV.DATABASE_KEYS) ?? 'postgres',
  };
}

/** Sticky session profile — set via pg_set_profile or optional tool `profile` with stick=true. */
let activeSessionProfile: PgProfileName = resolveStartupProfile();

export function getActiveProfile(): PgProfileName {
  return activeSessionProfile;
}

export function setActiveProfile(profile: PgProfileName): PgConnectionConfig {
  activeSessionProfile = profile;
  return buildConnectionForProfile(profile);
}

export function getActiveConnection(): PgConnectionConfig {
  return buildConnectionForProfile(activeSessionProfile);
}

/** Resolve which connection to use for a call (one-shot profile override or sticky session). */
export function resolveConnection(profileOverride?: string | null): PgConnectionConfig {
  const parsed = parseProfileName(profileOverride);
  if (parsed) {
    return buildConnectionForProfile(parsed);
  }
  return getActiveConnection();
}

export const env = {
  /** @deprecated Prefer getActiveConnection() — kept for allowWrite / limits. */
  get connection(): PgConnectionConfig {
    return getActiveConnection();
  },
  allowWrite: readBool(PG.ENV.ALLOW_WRITE_KEYS, false),
  queryTimeoutMs: readInt(PG.ENV.TIMEOUT_KEYS, PG.LIMITS.TIMEOUT_DEFAULT_MS),
  maxRows: readInt(PG.ENV.MAX_ROWS_KEYS, PG.LIMITS.MAX_ROWS_DEFAULT),
  startupProfile: resolveStartupProfile(),
};

export function validateEnv(): void {
  const c = getActiveConnection();
  const hasUrl = Boolean(c.connectionString);
  const hasHostUser = Boolean(c.host && c.user);
  if (!hasUrl && !hasHostUser) {
    console.error(PG.MESSAGES.CONNECT_MISSING);
  }
}

export function maskSecret(value: string): string {
  if (!value) {
    return '(empty)';
  }
  if (value.length <= 2) {
    return '**';
  }
  return `${value.slice(0, 1)}***${value.slice(-1)}`;
}
