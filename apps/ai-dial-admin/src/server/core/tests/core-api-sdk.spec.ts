import { Token } from '@/src/models/auth';
import { CORE_TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { CoreApi } from '../core-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { 'content-type': 'application/json' };

/** Exposes the protected adapters over two real SDK operations. */
class TestCoreApi extends CoreApi {
  action(token: Token) {
    return this.sdkAction(token, (init) => this.sdk.getUserInfo(init));
  }

  value(token: Token) {
    return this.sdkGet(token, (init) => this.sdk.getUserBucket(init));
  }
}

describe('CoreApi.sdkAction', () => {
  const api = new TestCoreApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('returns the parsed JSON body with the etag on success', async () => {
    fetch.mockResponseOnce(JSON.stringify({ userId: 'u1' }), { headers: { ...JSON_HEADERS, etag: '"v1"' } });

    const result = await api.action(TOKEN_MOCK);

    expect(result).toEqual({ success: true, response: { userId: 'u1' }, etag: '"v1"' });
  });

  test('sends the caller token as the authorization header', async () => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });

    await api.action(TOKEN_MOCK);

    const [, init] = fetch.mock.calls[0] as [Request, RequestInit];
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer access_token_mock');
  });

  test('returns a text/plain success body as text', async () => {
    fetch.mockResponseOnce('{"not":"parsed"}', { headers: { 'content-type': 'text/plain' } });

    const result = await api.action(TOKEN_MOCK);

    expect(result.response).toBe('{"not":"parsed"}');
  });

  test('returns a non-JSON success body as its raw text instead of throwing', async () => {
    fetch.mockResponseOnce('plain words', { headers: JSON_HEADERS });

    const result = await api.action(TOKEN_MOCK);

    expect(result).toEqual({ success: true, response: 'plain words', etag: undefined });
  });

  test('returns an empty string for an empty success body', async () => {
    fetch.mockResponseOnce('', { status: 200 });

    const result = await api.action(TOKEN_MOCK);

    expect(result).toEqual({ success: true, response: '', etag: undefined });
  });

  test('treats a success body carrying an error field as a failure', async () => {
    fetch.mockResponseOnce(JSON.stringify({ error: 'Conflict', message: 'Already exists' }), {
      headers: JSON_HEADERS,
    });

    const result = await api.action(TOKEN_MOCK);

    expect(result).toMatchObject({
      success: false,
      status: 200,
      errorHeader: 'Conflict',
      errorMessage: 'Already exists',
    });
  });

  test('normalizes a nested JSON error body', async () => {
    fetch.mockResponseOnce(JSON.stringify({ error: { message: 'Bad input', code: '400' } }), {
      status: 400,
      headers: { ...JSON_HEADERS, traceparent: 'trace-1', etag: '"v2"' },
    });

    const result = await api.action(TOKEN_MOCK);

    expect(result).toMatchObject({
      success: false,
      status: 400,
      errorMessage: 'Bad input',
      requestId: 'trace-1',
      etag: '"v2"',
    });
  });

  test('normalizes a plain-text error body', async () => {
    fetch.mockResponseOnce('Resource is locked', { status: 409 });

    const result = await api.action(TOKEN_MOCK);

    expect(result).toMatchObject({ success: false, status: 409, errorMessage: 'Resource is locked' });
  });

  test('fails an empty-body error with the status fallback message', async () => {
    fetch.mockResponseOnce('', { status: 404, headers: { 'content-length': '0' } });

    const result = await api.action(TOKEN_MOCK);

    expect(result).toMatchObject({ success: false, status: 404, errorHeader: 'Not Found' });
  });

  test('resolves an aborted call to the cancelled envelope instead of throwing', async () => {
    fetch.mockRejectOnce(new DOMException('Aborted', 'AbortError'));

    const result = await api.action(TOKEN_MOCK);

    expect(result).toEqual({ success: false, status: 0, errorMessage: 'Request cancelled' });
  });

  test('rethrows a network error that is not an abort', async () => {
    fetch.mockRejectOnce(new Error('Network error'));

    await expect(api.action(TOKEN_MOCK)).rejects.toThrow('Network error');
  });
});

describe('CoreApi.sdkGet', () => {
  const api = new TestCoreApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('returns the parsed body on success', async () => {
    fetch.mockResponseOnce(JSON.stringify({ bucket: 'b' }), { headers: JSON_HEADERS });

    expect(await api.value(TOKEN_MOCK)).toEqual({ bucket: 'b' });
  });

  test('returns undefined on 403', async () => {
    fetch.mockResponseOnce('Forbidden', { status: 403 });

    expect(await api.value(TOKEN_MOCK)).toBeUndefined();
  });

  test('returns null on any other failure', async () => {
    fetch.mockResponseOnce(JSON.stringify({ error: { message: 'boom' } }), { status: 500, headers: JSON_HEADERS });

    expect(await api.value(TOKEN_MOCK)).toBeNull();
  });

  test('returns null when the call is aborted', async () => {
    fetch.mockRejectOnce(new DOMException('Aborted', 'AbortError'));

    expect(await api.value(TOKEN_MOCK)).toBeNull();
  });
});
