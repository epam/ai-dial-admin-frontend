import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { TRY_OUT_PROXY_ERROR_HEADER, TRY_OUT_TRACE_URL_HEADER } from '@/src/components/TryOut/Deployment/constants';
import { DeploymentTryOutRequest } from '@/src/components/TryOut/Deployment/models';
import { APPLICATION_JSON_TYPE, SSE_STREAM_TYPE } from '@/src/constants/request-headers';
import { buildQueryString, filterRequestHeaders, getCorePath } from '@/src/server/try-out/build-core-request';
import { TRY_OUT_TIMEOUT_MS } from '@/src/server/try-out/constants';
import { requestRegistry } from '@/src/utils/api/request-registry';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { buildTraceUrl } from '@/src/utils/grafana/build-trace-url';
import { getGrafanaConfig } from '@/src/utils/grafana/get-grafana-config';
import { parseTraceparent } from '@/src/utils/grafana/parse-traceparent';
import { normalizeUrl } from '@/src/utils/url';

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const CLIENT_CLOSED_REQUEST = 499;
const BAD_GATEWAY = 502;
const FORWARDED_RESPONSE_HEADERS = ['content-type', 'x-request-id'];

const proxyError = (message: string, status: number) =>
  NextResponse.json({ error: { message } }, { status, headers: { [TRY_OUT_PROXY_ERROR_HEADER]: '1' } });

/**
 * Forwards one Try out request to Core with the signed-in admin's own token and streams Core's answer back,
 * status included, so Core alone decides what the admin may call.
 *
 * The target path comes from a fixed table, never from the caller, and the caller's credential headers are
 * dropped: the route can reach nothing the admin's token could not reach on Core directly.
 *
 * The auth check is the handler's own, as `middleware.ts` excludes `/api` from its matcher.
 */
export async function POST(req: NextRequest) {
  const isAuthRequired = getIsEnableAuthToggle();
  const token = await getUserToken(isAuthRequired, headers(), cookies());

  if (isAuthRequired && !token) {
    return proxyError('Not authenticated', UNAUTHORIZED);
  }

  const request = (await req.json().catch(() => null)) as Partial<DeploymentTryOutRequest> | null;
  const corePath = getCorePath(request?.interface, request?.deployment);

  if (!request || !corePath) {
    return proxyError('Unsupported interface or missing deployment', BAD_REQUEST);
  }

  const coreUrl = normalizeUrl(process.env.DIAL_CORE_API_URL, false);

  if (!coreUrl) {
    return proxyError('Core is not configured', BAD_GATEWAY);
  }

  const requestId = crypto.randomUUID();
  const controller = requestRegistry.register(requestId);
  const unregister = () => requestRegistry.unregister(requestId);
  const signal = AbortSignal.any([controller.signal, req.signal, AbortSignal.timeout(TRY_OUT_TIMEOUT_MS)]);

  try {
    const coreResponse = await fetch(`${coreUrl}${corePath}${buildQueryString(request.query)}`, {
      method: 'POST',
      headers: {
        'content-type': APPLICATION_JSON_TYPE,
        accept: `${APPLICATION_JSON_TYPE}, ${SSE_STREAM_TYPE}`,
        ...filterRequestHeaders(request.headers),
        ...getAuthorizationHeader(token),
      },
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal,
    });

    const responseHeaders = new Headers();
    FORWARDED_RESPONSE_HEADERS.forEach((name) => {
      const value = coreResponse.headers.get(name);
      if (value) {
        responseHeaders.set(name, value);
      }
    });
    responseHeaders.set('cache-control', 'no-cache');

    const grafanaConfig = getGrafanaConfig(process.env);
    const traceId = parseTraceparent(coreResponse.headers.get('traceparent'));
    if (grafanaConfig && traceId) {
      responseHeaders.set(TRY_OUT_TRACE_URL_HEADER, buildTraceUrl(grafanaConfig, traceId));
    }

    if (!coreResponse.body) {
      unregister();
      return new Response(null, { status: coreResponse.status, headers: responseHeaders });
    }

    // The request stays registered until the stream ends, so a logout still cancels a reply in progress.
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    coreResponse.body
      .pipeTo(writable)
      .catch(() => void 0)
      .finally(unregister);

    return new Response(readable, { status: coreResponse.status, headers: responseHeaders });
  } catch (error) {
    unregister();

    if ((error as Error).name === 'AbortError') {
      return proxyError('Request cancelled', CLIENT_CLOSED_REQUEST);
    }

    return proxyError(error instanceof Error ? error.message : 'Core could not be reached', BAD_GATEWAY);
  }
}
