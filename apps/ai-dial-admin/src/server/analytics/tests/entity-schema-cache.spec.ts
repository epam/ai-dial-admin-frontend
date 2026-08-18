import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { AnalyticsEntitySchema, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { Token } from '@/src/models/auth';
import {
  ENTITY_SCHEMA_CACHE_TTL_MS,
  clearEntitySchemaCache,
  withEntitySchemaCache,
} from '@/src/server/analytics/entity-schema-cache';

const ENTITY = 'conversations';

const caller = (userId: string): Token => ({ userId }) as unknown as Token;

const schemaOf = (name: string): AnalyticsEntitySchema => ({
  fields: [{ name, type: AnalyticsFieldType.Integer, source: name }],
});

const fieldNames = (schema: AnalyticsEntitySchema | null): string[] => (schema?.fields ?? []).map((f) => f.name);

beforeEach(() => {
  clearEntitySchemaCache();
  vi.useFakeTimers();
});

afterEach(() => vi.useRealTimers());

describe('withEntitySchemaCache', () => {
  test('resolves through the loader on a miss', async () => {
    const load = vi.fn().mockResolvedValue(schemaOf('success_count'));

    const schema = await withEntitySchemaCache(ENTITY, caller('u1'), load);

    expect(load).toHaveBeenCalledTimes(1);
    expect(fieldNames(schema)).toEqual(['success_count']);
  });

  test('serves a stored entry within its lifetime without loading again', async () => {
    const load = vi.fn().mockResolvedValue(schemaOf('success_count'));

    await withEntitySchemaCache(ENTITY, caller('u1'), load);
    vi.advanceTimersByTime(ENTITY_SCHEMA_CACHE_TTL_MS - 1);
    const schema = await withEntitySchemaCache(ENTITY, caller('u1'), load);

    expect(load).toHaveBeenCalledTimes(1);
    expect(fieldNames(schema)).toEqual(['success_count']);
  });

  // The schema is stable, not immutable: a table schema patch changes it, so an entry that never expired
  // would pin the view to a field set the entity no longer has.
  test('re-resolves once the lifetime has elapsed', async () => {
    const load = vi.fn().mockResolvedValueOnce(schemaOf('success_count')).mockResolvedValue(schemaOf('reasoning'));

    await withEntitySchemaCache(ENTITY, caller('u1'), load);
    vi.advanceTimersByTime(ENTITY_SCHEMA_CACHE_TTL_MS + 1);
    const schema = await withEntitySchemaCache(ENTITY, caller('u1'), load);

    expect(load).toHaveBeenCalledTimes(2);
    expect(fieldNames(schema)).toEqual(['reasoning']);
  });

  // The service filters sensitive columns by the caller's role, so one entity has more than one correct
  // schema and an entry must never cross a caller.
  test('does not serve one caller the entry another caller resolved', async () => {
    const load = vi.fn().mockResolvedValueOnce(schemaOf('sensitive_field')).mockResolvedValue(schemaOf('public'));

    await withEntitySchemaCache(ENTITY, caller('admin'), load);
    const schema = await withEntitySchemaCache(ENTITY, caller('reader'), load);

    expect(load).toHaveBeenCalledTimes(2);
    expect(fieldNames(schema)).toEqual(['public']);
  });

  test('keys separate entities apart', async () => {
    const load = vi.fn().mockResolvedValueOnce(schemaOf('a')).mockResolvedValue(schemaOf('b'));

    await withEntitySchemaCache(ENTITY, caller('u1'), load);
    const schema = await withEntitySchemaCache('rate_analytics', caller('u1'), load);

    expect(load).toHaveBeenCalledTimes(2);
    expect(fieldNames(schema)).toEqual(['b']);
  });

  // A failure describes one request rather than the schema, so caching it would stretch a single outage
  // across the whole lifetime.
  test('does not store a failed load', async () => {
    const load = vi.fn().mockResolvedValueOnce(null).mockResolvedValue(schemaOf('success_count'));

    const first = await withEntitySchemaCache(ENTITY, caller('u1'), load);
    const second = await withEntitySchemaCache(ENTITY, caller('u1'), load);

    expect(first).toBeNull();
    expect(load).toHaveBeenCalledTimes(2);
    expect(fieldNames(second)).toEqual(['success_count']);
  });

  // With auth disabled there is no token at all, and every request is the same principal.
  test('shares one entry across an absent token', async () => {
    const load = vi.fn().mockResolvedValue(schemaOf('success_count'));

    await withEntitySchemaCache(ENTITY, undefined, load);
    await withEntitySchemaCache(ENTITY, undefined, load);

    expect(load).toHaveBeenCalledTimes(1);
  });

  test('clearing drops every entry', async () => {
    const load = vi.fn().mockResolvedValue(schemaOf('success_count'));

    await withEntitySchemaCache(ENTITY, caller('u1'), load);
    clearEntitySchemaCache();
    await withEntitySchemaCache(ENTITY, caller('u1'), load);

    expect(load).toHaveBeenCalledTimes(2);
  });
});
