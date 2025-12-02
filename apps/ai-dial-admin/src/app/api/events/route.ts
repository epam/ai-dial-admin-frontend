import { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { CONTAINER_EVENTS_URL } from '@/src/server/deployments/containers';

export async function GET(req: NextRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const id = req.nextUrl.searchParams.get('id') ?? '';

  const backendUrl = `${process.env.DIAL_DEPLOYMENTS_API_URL}${CONTAINER_EVENTS_URL(id)}`;

  const backendRes = await fetch(backendUrl, {
    method: 'GET',
    headers: {
      ['authorization']: 'Bearer ' + token?.access_token,
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
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
