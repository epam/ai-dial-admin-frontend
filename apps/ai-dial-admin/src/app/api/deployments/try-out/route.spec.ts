import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { TRY_OUT_PROXY_ERROR_HEADER, TRY_OUT_TRACE_URL_HEADER } from '@/src/components/TryOut/Deployment/constants';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

import { POST } from './route';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');

const CORE_URL = 'http://core.test';
const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const TRACEPARENT = `00-${TRACE_ID}-00f067aa0ba902b7-01`;

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/deployments/try-out', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

const CHAT_REQUEST = {
  interface: DeploymentInterfaceType.OpenAIChatCompletions,
  deployment: 'applications/my app',
  body: { messages: [{ role: 'user', content: 'hi' }] },
};

describe('POST /api/deployments/try-out', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
    vi.stubEnv('DIAL_CORE_API_URL', CORE_URL);
    fetchMock.mockReset().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  const lastCoreCall = () => {
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    return { url, init, headers: init.headers as Record<string, string> };
  };

  describe('target', () => {
    test.each([
      [
        DeploymentInterfaceType.OpenAIChatCompletions,
        `${CORE_URL}/openai/deployments/applications/my%20app/chat/completions`,
      ],
      [DeploymentInterfaceType.OpenAIResponses, `${CORE_URL}/openai/v1/responses`],
      [DeploymentInterfaceType.AnthropicMessages, `${CORE_URL}/anthropic/v1/messages`],
      [DeploymentInterfaceType.OpenAIEmbeddings, `${CORE_URL}/openai/deployments/applications/my%20app/embeddings`],
    ])('sends %s to its Core path', async (type, expectedUrl) => {
      await POST(makeRequest({ ...CHAT_REQUEST, interface: type }));

      expect(lastCoreCall().url).toBe(expectedUrl);
    });

    test.each(['somethingElse', undefined])('refuses interface %s without calling Core', async (type) => {
      const res = await POST(makeRequest({ ...CHAT_REQUEST, interface: type }));

      expect(res.status).toBe(400);
      expect(res.headers.get(TRY_OUT_PROXY_ERROR_HEADER)).toBe('1');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('refuses chat completions with no deployment', async () => {
      const res = await POST(makeRequest({ ...CHAT_REQUEST, deployment: '' }));

      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('refuses a body that is not JSON', async () => {
      const res = await POST(makeRequest('not json'));

      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('answers 502 when Core is not configured', async () => {
      vi.stubEnv('DIAL_CORE_API_URL', '');

      const res = await POST(makeRequest(CHAT_REQUEST));

      expect(res.status).toBe(502);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('forwards query parameters and the JSON body', async () => {
      await POST(makeRequest({ ...CHAT_REQUEST, query: { 'api-version': '1', ' ': 'x' } }));

      const { url, init } = lastCoreCall();
      expect(url).toContain('?api-version=1');
      expect(url).not.toContain('%20=');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(CHAT_REQUEST.body));
    });
  });

  describe('credentials', () => {
    test("sends the admin's own token", async () => {
      await POST(makeRequest(CHAT_REQUEST));

      expect(lastCoreCall().headers).toMatchObject(getAuthorizationHeader(TOKEN_MOCK));
    });

    test('ignores credential headers supplied by the caller', async () => {
      await POST(
        makeRequest({
          ...CHAT_REQUEST,
          headers: {
            Authorization: 'Bearer stolen',
            'API-Key': 'stolen',
            'x-api-key': 'stolen',
            Cookie: 'session=stolen',
            'X-Custom': 'kept',
          },
        }),
      );

      const names = Object.keys(lastCoreCall().headers).map((name) => name.toLowerCase());
      expect(lastCoreCall().headers).toMatchObject({ 'X-Custom': 'kept', ...getAuthorizationHeader(TOKEN_MOCK) });
      expect(JSON.stringify(lastCoreCall().headers)).not.toContain('stolen');
      expect(names).not.toContain('api-key');
      expect(names).not.toContain('x-api-key');
      expect(names).not.toContain('cookie');
    });

    test('refuses a caller with no token while auth is enabled', async () => {
      vi.mocked(getUserToken).mockResolvedValue(undefined as never);

      const res = await POST(makeRequest(CHAT_REQUEST));

      expect(res.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('sends no authorization when auth is disabled', async () => {
      vi.mocked(getIsEnableAuthToggle).mockReturnValue(false);
      vi.mocked(getUserToken).mockResolvedValue(undefined as never);

      await POST(makeRequest(CHAT_REQUEST));

      expect(Object.keys(lastCoreCall().headers).map((name) => name.toLowerCase())).not.toContain('authorization');
    });
  });

  describe('response', () => {
    test("passes Core's status and body through", async () => {
      fetchMock.mockResolvedValue(
        new Response('{"error":"no"}', { status: 403, headers: { 'content-type': 'application/json' } }),
      );

      const res = await POST(makeRequest(CHAT_REQUEST));

      expect(res.status).toBe(403);
      expect(res.headers.has(TRY_OUT_PROXY_ERROR_HEADER)).toBe(false);
      expect(await res.text()).toBe('{"error":"no"}');
    });

    test('streams an event-stream answer', async () => {
      fetchMock.mockResolvedValue(
        new Response('data: {"a":1}\n\n', { status: 200, headers: { 'content-type': 'text/event-stream' } }),
      );

      const res = await POST(makeRequest(CHAT_REQUEST));

      expect(res.headers.get('content-type')).toBe('text/event-stream');
      expect(await res.text()).toBe('data: {"a":1}\n\n');
    });

    test('answers 502 as its own error when Core cannot be reached', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const res = await POST(makeRequest(CHAT_REQUEST));

      expect(res.status).toBe(502);
      expect(res.headers.get(TRY_OUT_PROXY_ERROR_HEADER)).toBe('1');
    });

    test('reports a cancelled request without a Core status', async () => {
      fetchMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }));

      const res = await POST(makeRequest(CHAT_REQUEST));

      expect(res.status).toBe(499);
      expect(res.headers.get(TRY_OUT_PROXY_ERROR_HEADER)).toBe('1');
    });
  });

  describe('trace link', () => {
    const answerWithTraceparent = (traceparent?: string) =>
      fetchMock.mockResolvedValue(
        new Response('{}', { status: 200, headers: traceparent ? { traceparent } : undefined }),
      );

    test('is returned when Grafana is configured and Core sent a traceparent', async () => {
      vi.stubEnv('GRAFANA_TRACES_URL', 'https://grafana.test');
      answerWithTraceparent(TRACEPARENT);

      const res = await POST(makeRequest(CHAT_REQUEST));

      const url = res.headers.get(TRY_OUT_TRACE_URL_HEADER) ?? '';
      expect(url.startsWith('https://grafana.test/explore')).toBe(true);
      expect(decodeURIComponent(url)).toContain(TRACE_ID);
    });

    test('is absent when Grafana is not configured', async () => {
      vi.stubEnv('GRAFANA_TRACES_URL', '');
      answerWithTraceparent(TRACEPARENT);

      const res = await POST(makeRequest(CHAT_REQUEST));

      expect(res.headers.has(TRY_OUT_TRACE_URL_HEADER)).toBe(false);
    });

    test.each([undefined, 'garbage'])('is absent for traceparent %s', async (traceparent) => {
      vi.stubEnv('GRAFANA_TRACES_URL', 'https://grafana.test');
      answerWithTraceparent(traceparent);

      const res = await POST(makeRequest(CHAT_REQUEST));

      expect(res.headers.has(TRY_OUT_TRACE_URL_HEADER)).toBe(false);
    });
  });
});
