import { requestRegistry } from '@/src/utils/api/request-registry';
import { CORE_TEST_URL } from '@/src/utils/tests/mock/api.mock';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { coreFetch, getCoreSdk } from '../sdk-client';

const fetch = createFetchMock(vi);
fetch.enableMocks();

/** Resolves only once the signal it was given aborts, then rejects the way `fetch` does. */
const hangUntilAborted = (_request: unknown, init?: RequestInit) =>
  new Promise<Response>((_, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });

const lastInit = () => fetch.mock.lastCall?.[1] as RequestInit;

describe('getCoreSdk', () => {
  test('returns the same instance for the same host', () => {
    expect(getCoreSdk(CORE_TEST_URL)).toBe(getCoreSdk(CORE_TEST_URL));
  });

  test('returns a separate instance for a different host', () => {
    expect(getCoreSdk(CORE_TEST_URL)).not.toBe(getCoreSdk('http://other-core.test/'));
  });

  test('joins a slash-terminated host with the SDK paths without a double slash', async () => {
    fetch.mockResponseOnce(JSON.stringify({ bucket: 'b' }), { headers: { 'content-type': 'application/json' } });

    await getCoreSdk(CORE_TEST_URL).getUserBucket();

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://core.test/v1/bucket' }),
      expect.anything(),
    );
  });
});

describe('coreFetch', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('registers the request for its duration and unregisters it afterwards', async () => {
    const register = vi.spyOn(requestRegistry, 'register');
    const unregister = vi.spyOn(requestRegistry, 'unregister');
    fetch.mockResponseOnce('{}');

    await coreFetch(new Request(`${CORE_TEST_URL}v1/bucket`));

    expect(register).toHaveBeenCalledOnce();
    expect(unregister).toHaveBeenCalledWith(register.mock.calls[0][0]);
  });

  test('unregisters the request when fetch rejects', async () => {
    const unregister = vi.spyOn(requestRegistry, 'unregister');
    fetch.mockRejectOnce(new Error('Network error'));

    await expect(coreFetch(new Request(`${CORE_TEST_URL}v1/bucket`))).rejects.toThrow('Network error');

    expect(unregister).toHaveBeenCalledOnce();
  });

  test('is aborted when the registry cancels all requests', async () => {
    fetch.mockImplementationOnce(hangUntilAborted);

    const pending = coreFetch(new Request(`${CORE_TEST_URL}v1/bucket`));
    requestRegistry.cancelAll();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('is aborted by the caller’s own signal without cancelling the registry', async () => {
    const cancelAll = vi.spyOn(requestRegistry, 'cancelAll');
    const caller = new AbortController();
    fetch.mockImplementationOnce(hangUntilAborted);

    const pending = coreFetch(new Request(`${CORE_TEST_URL}v1/bucket`, { signal: caller.signal }));
    caller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(cancelAll).not.toHaveBeenCalled();
  });

  test('sends the request uncached and asks for JSON by default', async () => {
    fetch.mockResponseOnce('{}');

    await coreFetch(new Request(`${CORE_TEST_URL}v1/bucket`));

    expect(lastInit().cache).toBe('no-store');
    expect(new Headers(lastInit().headers).get('Accept')).toBe('application/json');
  });

  test('keeps the request’s own Accept and authorization headers', async () => {
    fetch.mockResponseOnce('1.2.3');

    await coreFetch(
      new Request(`${CORE_TEST_URL}version`, { headers: { Accept: 'text/plain', authorization: 'Bearer t' } }),
    );

    const headers = new Headers(lastInit().headers);
    expect(headers.get('Accept')).toBe('text/plain');
    expect(headers.get('authorization')).toBe('Bearer t');
  });

  test('accepts a URL string as well as a Request', async () => {
    fetch.mockResponseOnce('{}');

    await coreFetch(`${CORE_TEST_URL}v1/bucket`, { method: 'GET' });

    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://core.test/v1/bucket', method: 'GET' }),
      expect.anything(),
    );
  });
});
