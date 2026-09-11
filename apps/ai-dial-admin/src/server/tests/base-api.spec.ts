import { describe, test, expect, beforeEach, vi } from 'vitest';
import { BaseApi } from '../base-api';
import { DEFAULT_ETAG, IF_MATCH } from '@/src/constants/api-headers';
import { requestRegistry } from '@/src/utils/api/request-registry';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import * as sendRequestModule from '@/src/utils/api/send-request';

describe('BaseApi request cancellation', () => {
  let api: TestApi;

  class TestApi extends BaseApi {
    // Expose protected methods for testing
    public async testSendRequest(url: string, type: string) {
      return this.sendRequest(url, type);
    }

    public async testSendActionRequest(url: string, type: string) {
      return this.sendActionRequest(url, type);
    }

    public async testPutActionWithEtag(url: string, dto: object, etag: string | undefined) {
      return this.putActionWithEtag(url, dto, TOKEN_MOCK, etag);
    }
  }

  beforeEach(() => {
    vi.clearAllMocks();
    requestRegistry.cancelAll();
    api = new TestApi({ host: 'http://test.com' });
  });

  test('sendRequest registers and unregisters controller on success', async () => {
    const registerSpy = vi.spyOn(requestRegistry, 'register');
    const unregisterSpy = vi.spyOn(requestRegistry, 'unregister');

    // Mock successful response
    vi.spyOn(sendRequestModule, 'sendRequest').mockResolvedValue(
      new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await api.testSendRequest('/test', 'GET');

    expect(registerSpy).toHaveBeenCalledOnce();
    expect(unregisterSpy).toHaveBeenCalledOnce();

    const registeredId = registerSpy.mock.calls[0][0];
    const unregisteredId = unregisterSpy.mock.calls[0][0];
    expect(registeredId).toBe(unregisteredId);
  });

  test('sendRequest unregisters controller even on error', async () => {
    const unregisterSpy = vi.spyOn(requestRegistry, 'unregister');

    // Mock error response
    vi.spyOn(sendRequestModule, 'sendRequest').mockResolvedValue(
      new Response('Server Error', {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      }),
    );

    await api.testSendRequest('/test', 'GET');

    expect(unregisterSpy).toHaveBeenCalledOnce();
  });

  test('sendRequest handles AbortError gracefully', async () => {
    const unregisterSpy = vi.spyOn(requestRegistry, 'unregister');

    // Mock AbortError
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    vi.spyOn(sendRequestModule, 'sendRequest').mockRejectedValue(abortError);

    const result = await api.testSendRequest('/test', 'GET');

    expect(result).toBeNull();
    expect(unregisterSpy).toHaveBeenCalledOnce();
  });

  test('cancelAll aborts in-flight request', async () => {
    let abortController: AbortController | undefined;

    // Capture the AbortController passed to sendRequest
    vi.spyOn(sendRequestModule, 'sendRequest').mockImplementation(async (_url, _type, _headers, _dto, signal) => {
      // Store the signal to check if it gets aborted
      if (signal) {
        abortController = { signal } as AbortController;
      }

      // Simulate a delayed request
      await new Promise((resolve) => setTimeout(resolve, 100));

      // If aborted, throw AbortError
      if (signal?.aborted) {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        throw error;
      }

      return new Response(JSON.stringify({ data: 'test' }), { status: 200 });
    });

    // Start request (don't await yet)
    const requestPromise = api.testSendRequest('/test', 'GET');

    // Cancel all requests while in flight
    await new Promise((resolve) => setTimeout(resolve, 10)); // Let request start
    requestRegistry.cancelAll();

    // Wait for request to complete
    const result = await requestPromise;

    // Should have been aborted
    expect(result).toBeNull();
    expect(abortController?.signal.aborted).toBe(true);
  });

  test('sendActionRequest handles AbortError gracefully', async () => {
    const unregisterSpy = vi.spyOn(requestRegistry, 'unregister');

    // Mock AbortError
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    vi.spyOn(sendRequestModule, 'sendRequest').mockRejectedValue(abortError);

    const result = await api.testSendActionRequest('/test', 'POST');

    expect(result).toEqual({
      success: false,
      status: 0,
      errorMessage: 'Request cancelled',
    });
    expect(unregisterSpy).toHaveBeenCalledOnce();
  });
});

describe('BaseApi putActionWithEtag', () => {
  class TestApi extends BaseApi {
    public async testPutActionWithEtag(url: string, dto: object, etag: string | undefined) {
      return this.putActionWithEtag(url, dto, TOKEN_MOCK, etag);
    }
  }

  let api: TestApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new TestApi({ host: 'http://test.com' });
    vi.spyOn(sendRequestModule, 'sendRequest').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
  });

  test('sends If-Match with the given etag when one is defined', async () => {
    await api.testPutActionWithEtag('/test', {}, 'real-etag');

    expect(sendRequestModule.sendRequest).toHaveBeenCalledWith(
      expect.anything(),
      'PUT',
      expect.objectContaining({ [IF_MATCH]: 'real-etag' }),
      expect.anything(),
      expect.anything(),
    );
  });

  test('sends If-Match: * when DEFAULT_ETAG is passed explicitly', async () => {
    await api.testPutActionWithEtag('/test', {}, DEFAULT_ETAG);

    expect(sendRequestModule.sendRequest).toHaveBeenCalledWith(
      expect.anything(),
      'PUT',
      expect.objectContaining({ [IF_MATCH]: DEFAULT_ETAG }),
      expect.anything(),
      expect.anything(),
    );
  });

  test('omits If-Match entirely when etag is undefined', async () => {
    await api.testPutActionWithEtag('/test', {}, undefined);

    const headers = (sendRequestModule.sendRequest as ReturnType<typeof vi.fn>).mock.calls[0][2];
    expect(headers).not.toHaveProperty(IF_MATCH);
  });
});
