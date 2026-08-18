import { AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { Token } from '@/src/models/auth';

// The schema describes a table's shape rather than its contents, so it changes on a schema patch and not
// when rows arrive. The lifetime bounds how long a patched entity can stay hidden behind a stale entry.
export const ENTITY_SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000;

const ANONYMOUS_CALLER = 'anonymous';

interface CacheEntry {
  schema: AnalyticsEntitySchema;
  expiresAt: number;
}

const entries = new Map<string, CacheEntry>();

// The service filters `sensitive` columns out of a schema by the caller's role, so one entity has more
// than one correct answer. Keying by the caller is what stops an entry crossing a role boundary; with auth
// disabled every request is the same principal, so they share one key.
const cacheKey = (entity: string, token: Token): string => `${entity}|${token?.userId ?? ANONYMOUS_CALLER}`;

/**
 * Reads `entity`'s schema for `token` from the cache, falling through to `load` on a miss or an expired
 * entry. A failed load is not stored: a failure describes one request rather than the schema, so caching
 * it would stretch a single outage across the whole lifetime.
 */
export const withEntitySchemaCache = async (
  entity: string,
  token: Token,
  load: () => Promise<AnalyticsEntitySchema | null>,
): Promise<AnalyticsEntitySchema | null> => {
  const key = cacheKey(entity, token);
  const cached = entries.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.schema;
  }
  entries.delete(key);

  const schema = await load();
  if (schema) {
    entries.set(key, { schema, expiresAt: Date.now() + ENTITY_SCHEMA_CACHE_TTL_MS });
  }

  return schema;
};

export const clearEntitySchemaCache = (): void => entries.clear();
