import { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { APPLICATION_JSON_TYPE, SSE_STREAM_TYPE } from '@/src/constants/request-headers';
import { normalizeUrl } from '@/src/utils/url';
import { API } from '@/src/server/api';
import { requestRegistry } from '@/src/utils/api/request-registry';

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const controller = requestRegistry.register(requestId);

  try {
    const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
    const testSuiteIds = req.nextUrl.searchParams.get('testSuiteIds') ?? '';

    const backendUrl = `${normalizeUrl(process.env.DIAL_EVAL_API_URL)}${API}/test-suite-runs/status-stream?testSuiteIds=${encodeURIComponent(testSuiteIds)}`;

    const backendRes = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        ...getAuthorizationHeader(token),
        Accept: SSE_STREAM_TYPE,
        'Content-Type': APPLICATION_JSON_TYPE,
      },
      signal: controller.signal,
    });

    if (!backendRes.ok || !backendRes.body) {
      return new Response('Failed to connect to backend SSE', { status: 502 });
    }

    return new Response(backendRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    // Request cancelled during logout, this is expected
    if ((error as Error).name === 'AbortError') {
      return new Response('Request cancelled', { status: 499 });
    }
    throw error;
  } finally {
    requestRegistry.unregister(requestId);
  }
}
