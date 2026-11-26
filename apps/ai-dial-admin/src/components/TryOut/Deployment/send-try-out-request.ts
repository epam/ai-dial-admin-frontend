import { TRY_OUT_PROXY_ERROR_HEADER, TRY_OUT_TRACE_URL_HEADER } from '@/src/components/TryOut/Deployment/constants';
import { DeploymentTryOutRequest } from '@/src/components/TryOut/Deployment/models';
import { ApiRoute } from '@/src/constants/api-routes';
import { APPLICATION_JSON_TYPE, SSE_STREAM_TYPE } from '@/src/constants/request-headers';

export interface DeploymentTryOutResponse {
  status: number;
  /** True when the route itself answered (bad request, no Core), not Core. */
  isProxyError: boolean;
  isEventStream: boolean;
  /** Grafana link to this request's trace; absent without Grafana config or a trace id. */
  traceUrl?: string;
  response: Response;
}

/** Posts the request to the Try out route. Rejects on a network failure and on `signal` abort. */
export const sendDeploymentTryOut = async (
  request: DeploymentTryOutRequest,
  signal?: AbortSignal,
): Promise<DeploymentTryOutResponse> => {
  const response = await fetch(ApiRoute.DeploymentTryOut, {
    method: 'POST',
    headers: { 'Content-Type': APPLICATION_JSON_TYPE },
    body: JSON.stringify(request),
    signal,
  });

  return {
    status: response.status,
    isProxyError: response.headers.has(TRY_OUT_PROXY_ERROR_HEADER),
    isEventStream: response.headers.get('content-type')?.includes(SSE_STREAM_TYPE) ?? false,
    traceUrl: response.headers.get(TRY_OUT_TRACE_URL_HEADER) ?? void 0,
    response,
  };
};
