import { afterEach, describe, expect, test, vi } from 'vitest';

import { TRY_OUT_PROXY_ERROR_HEADER, TRY_OUT_TRACE_URL_HEADER } from '@/src/components/TryOut/Deployment/constants';
import { sendDeploymentTryOut } from '@/src/components/TryOut/Deployment/send-try-out-request';
import { ApiRoute } from '@/src/constants/api-routes';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

const REQUEST = { interface: DeploymentInterfaceType.OpenAIChatCompletions, deployment: 'gpt', body: { a: 1 } };

describe('sendDeploymentTryOut', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('posts the request as JSON to the Try out route with the abort signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { signal } = new AbortController();

    await sendDeploymentTryOut(REQUEST, signal);

    expect(fetchMock).toHaveBeenCalledWith(ApiRoute.DeploymentTryOut, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(REQUEST),
      signal,
    });
  });

  test('reads status, stream kind and trace link from the response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('', {
          status: 403,
          headers: { 'content-type': 'text/event-stream', [TRY_OUT_TRACE_URL_HEADER]: 'https://g/x' },
        }),
      ),
    );

    const result = await sendDeploymentTryOut(REQUEST);

    expect(result).toMatchObject({ status: 403, isEventStream: true, isProxyError: false, traceUrl: 'https://g/x' });
  });

  test('flags an answer the route produced itself', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 502, headers: { [TRY_OUT_PROXY_ERROR_HEADER]: '1' } })),
    );

    const result = await sendDeploymentTryOut(REQUEST);

    expect(result).toMatchObject({ isProxyError: true, isEventStream: false, traceUrl: undefined });
  });

  test('rejects when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(sendDeploymentTryOut(REQUEST)).rejects.toThrow('Failed to fetch');
  });
});
