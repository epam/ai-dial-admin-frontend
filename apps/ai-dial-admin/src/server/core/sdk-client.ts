import { createSDK, type DIAL_SDK } from '@epam/ai-dial-typescript-sdk';

import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { requestRegistry } from '@/src/utils/api/request-registry';
import { CACHE } from '@/src/utils/api/send-request';

const sdkByHost = new Map<string, DIAL_SDK>();

/**
 * The SDK's `fetch`. Keeps what `BaseApi.fetchRegistered` guarantees for hand-written calls: the request
 * is registered so logout cancels it, a caller's own signal (which `openapi-fetch` puts on the `Request`)
 * still aborts it, it is never cached, and it asks for JSON unless the call said otherwise. Delegates to
 * the global `fetch` so tracing instrumentation still sees it.
 */
export const coreFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const request = input instanceof Request ? input : new Request(input, init);
  const requestId = crypto.randomUUID();
  const controller = requestRegistry.register(requestId);

  const headers = new Headers(request.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', APPLICATION_JSON_TYPE);
  }

  try {
    return await fetch(request, {
      ...CACHE,
      headers,
      signal: AbortSignal.any([controller.signal, request.signal]),
    });
  } finally {
    // Unregistered once the headers arrive, before `openapi-fetch` reads the body — the same window
    // `BaseApi.fetchRegistered` covers. Core has already authorized the token by then, so logout
    // cancels requests in flight, not body reads.
    requestRegistry.unregister(requestId);
  }
};

/**
 * The SDK builds a `Request` per call, which rejects a relative URL with an opaque `Failed to parse URL`.
 * Failing here instead names the misconfigured variable.
 */
const assertAbsoluteCoreHost = (host: string): void => {
  let protocol: string | undefined;
  try {
    protocol = new URL(host).protocol;
  } catch {
    protocol = undefined;
  }

  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`DIAL_CORE_API_URL must be an absolute http(s) URL, got "${host}"`);
  }
};

/**
 * One SDK instance per Core host. It carries no token: every call passes its caller's `authorization`
 * header, so a shared instance never leaks one user's credentials into another's request.
 */
export const getCoreSdk = (host = ''): DIAL_SDK => {
  let sdk = sdkByHost.get(host);
  if (!sdk) {
    assertAbsoluteCoreHost(host);
    sdk = createSDK({ baseUrl: host, fetch: coreFetch });
    sdkByHost.set(host, sdk);
  }

  return sdk;
};
