import { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { IMAGE_LOGS_URL } from '@/src/server/deployments/images';
import { CONTAINER_LOGS_URL } from '@/src/server/deployments/containers';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { APPLICATION_JSON_TYPE, SSE_STREAM_TYPE } from '@/src/constants/request-headers';

export async function GET(req: NextRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const entity = req.nextUrl.searchParams.get('entity') ?? '';
  const id = req.nextUrl.searchParams.get('id') ?? '';
  const podName = req.nextUrl.searchParams.get('podName') ?? '';

  const backendUrl =
    entity === 'image'
      ? `${process.env.DIAL_DEPLOYMENTS_API_URL}${IMAGE_LOGS_URL(id)}`
      : `${process.env.DIAL_DEPLOYMENTS_API_URL}${CONTAINER_LOGS_URL(id, podName)}`;

  const backendRes = await fetch(backendUrl, {
    method: 'GET',
    headers: {
      ...getAuthorizationHeader(token),
      Accept: SSE_STREAM_TYPE,
      'Content-Type': APPLICATION_JSON_TYPE,
    },
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
}
