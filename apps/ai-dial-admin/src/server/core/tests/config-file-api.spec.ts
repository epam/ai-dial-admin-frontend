import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { ConfigFileEntityType, ConfigFileFailureReason } from '@/src/types/config-file-entity';
import { ConfigFileApi } from '../config-file-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: ConfigFileApi', () => {
  const instance = new ConfigFileApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('listNames calls GET v1/admin/config/file/{type} and returns the names', async () => {
    fetch.mockResponseOnce(JSON.stringify({ items: [{ name: 'first' }, { name: 'second' }] }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.listNames(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    const [calledUrl, options] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/admin/config/file/interceptors');
    expect(options?.method).toBe('GET');
    expect(result.success && result.data).toEqual(['first', 'second']);
  });

  test('listNames returns an empty list for an empty population', async () => {
    fetch.mockResponseOnce(JSON.stringify({ items: [] }), { headers: { 'content-type': 'application/json' } });

    const result = await instance.listNames(TOKEN_MOCK, ConfigFileEntityType.Roles);

    expect(result.success && result.data).toEqual([]);
  });

  test('listNames reports a refused read as a failure rather than an empty list', async () => {
    fetch.mockResponseOnce('Forbidden', { status: 403 });

    const result = await instance.listNames(TOKEN_MOCK, ConfigFileEntityType.Roles);

    expect(result.success).toBe(false);
    expect(!result.success && result.failure.reason).toBe(ConfigFileFailureReason.RequestFailed);
    expect(!result.success && result.failure.status).toBe(403);
  });

  // The parser was written from Core's source, not a sampled response. If the real envelope differs,
  // treating it as an empty population would hide half the options behind a silent pass.
  test('listNames reports a body that is not the documented items envelope as a failure', async () => {
    fetch.mockResponseOnce(JSON.stringify({ items: { first: {} } }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.listNames(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    expect(result.success).toBe(false);
    expect(!result.success && result.failure.reason).toBe(ConfigFileFailureReason.RequestFailed);
  });

  test('listNames reports a plain-text body as a failure rather than an empty list', async () => {
    fetch.mockResponseOnce('not json at all', { headers: { 'content-type': 'text/plain' } });

    const result = await instance.listNames(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    expect(result.success).toBe(false);
  });

  test('listNames sends the caller token', async () => {
    fetch.mockResponseOnce(JSON.stringify({ items: [] }), { headers: { 'content-type': 'application/json' } });

    await instance.listNames(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    const [, options] = fetch.mock.calls[0];
    expect(JSON.stringify(options?.headers)).toContain('access_token_mock');
  });

  test('getEntity reports a 404 distinguishably, since callers branch on it', async () => {
    fetch.mockResponseOnce('Not found', { status: 404 });

    const result = await instance.getEntity(TOKEN_MOCK, ConfigFileEntityType.Settings, 'global');

    expect(!result.success && result.failure.status).toBe(404);
  });

  test('listNames refuses a non-readable type without issuing a request', async () => {
    const result = await instance.listNames(TOKEN_MOCK, ConfigFileEntityType.Keys);

    expect(fetch.mock.calls).toHaveLength(0);
    expect(result.success).toBe(false);
    expect(!result.success && result.failure.reason).toBe(ConfigFileFailureReason.TypeNotReadable);
  });

  test('getEntity refuses a non-readable type without issuing a request', async () => {
    const result = await instance.getEntity(TOKEN_MOCK, ConfigFileEntityType.Keys, 'some-key');

    expect(fetch.mock.calls).toHaveLength(0);
    expect(!result.success && result.failure.reason).toBe(ConfigFileFailureReason.TypeNotReadable);
  });

  test('getEntity calls GET v1/admin/config/file/{type}/{name}', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'default', endpoint: 'http://x' }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.getEntity(TOKEN_MOCK, ConfigFileEntityType.Interceptors, 'default');

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/admin/config/file/interceptors/default');
    expect(result.success && result.data).toEqual({ name: 'default', endpoint: 'http://x' });
  });

  test('getEntity encodes a name containing a separator', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'a/b' }), { headers: { 'content-type': 'application/json' } });

    await instance.getEntity(TOKEN_MOCK, ConfigFileEntityType.Interceptors, 'a/b');

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/admin/config/file/interceptors/a%2Fb');
  });

  test('list returns every entity in full, not reduced to a name', async () => {
    fetch.mockResponseOnce(JSON.stringify({ items: [{ name: 'first' }, { name: 'second' }] }), {
      headers: { 'content-type': 'application/json' },
    });
    fetch.mockResponseOnce(JSON.stringify({ name: 'first', endpoint: 'http://a' }), {
      headers: { 'content-type': 'application/json' },
    });
    fetch.mockResponseOnce(JSON.stringify({ name: 'second', endpoint: 'http://b' }), {
      headers: { 'content-type': 'application/json' },
    });

    const result = await instance.list(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    expect(result.success && result.data.entities).toEqual([
      { name: 'first', endpoint: 'http://a' },
      { name: 'second', endpoint: 'http://b' },
    ]);
    expect(result.success && result.data.failures).toEqual([]);
  });

  test('list reports one entity failing to read without failing the whole population', async () => {
    fetch.mockResponseOnce(JSON.stringify({ items: [{ name: 'first' }, { name: 'second' }] }), {
      headers: { 'content-type': 'application/json' },
    });
    fetch.mockResponseOnce(JSON.stringify({ name: 'first' }), { headers: { 'content-type': 'application/json' } });
    fetch.mockResponseOnce('Not found', { status: 404 });

    const result = await instance.list(TOKEN_MOCK, ConfigFileEntityType.Interceptors);

    expect(result.success && result.data.entities).toEqual([{ name: 'first' }]);
    expect(result.success && result.data.failures).toHaveLength(1);
    expect(result.success && result.data.failures[0].status).toBe(404);
  });

  test('list refuses a non-readable type without issuing any request', async () => {
    const result = await instance.list(TOKEN_MOCK, ConfigFileEntityType.Keys);

    expect(fetch.mock.calls).toHaveLength(0);
    expect(result.success).toBe(false);
    expect(!result.success && result.failure.reason).toBe(ConfigFileFailureReason.TypeNotReadable);
  });

  test('list propagates a total failure to list names', async () => {
    fetch.mockResponseOnce('Forbidden', { status: 403 });

    const result = await instance.list(TOKEN_MOCK, ConfigFileEntityType.Roles);

    expect(result.success).toBe(false);
    expect(!result.success && result.failure.status).toBe(403);
  });

  test.each([
    ConfigFileEntityType.Models,
    ConfigFileEntityType.Routes,
    ConfigFileEntityType.Applications,
    ConfigFileEntityType.Toolsets,
  ])('listNames accepts the newly-widened type %s', async (type) => {
    fetch.mockResponseOnce(JSON.stringify({ items: [] }), { headers: { 'content-type': 'application/json' } });

    const result = await instance.listNames(TOKEN_MOCK, type);

    expect(fetch.mock.calls).toHaveLength(1);
    expect(result.success).toBe(true);
  });

  test('listNames still refuses Keys', async () => {
    const result = await instance.listNames(TOKEN_MOCK, ConfigFileEntityType.Keys);

    expect(fetch.mock.calls).toHaveLength(0);
    expect(!result.success && result.failure.reason).toBe(ConfigFileFailureReason.TypeNotReadable);
  });
});
