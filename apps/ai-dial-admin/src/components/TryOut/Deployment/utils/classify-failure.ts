import { TryOutFailure, TryOutFailureKind } from '@/src/components/TryOut/Deployment/models';

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const NOT_FOUND = 404;
const SERVER_ERROR_FROM = 500;

/**
 * Sorts a non-2xx answer by what the admin can do about it. `isProxyError` marks an answer the Try out route made
 * itself, so its 502 means Core was not reached rather than that Core failed.
 */
export const classifyTryOutFailure = (status: number, isProxyError: boolean): TryOutFailure => {
  if (isProxyError) {
    if (status === UNAUTHORIZED) {
      return { kind: TryOutFailureKind.NoAccess, status };
    }

    return { kind: status === BAD_REQUEST ? TryOutFailureKind.Rejected : TryOutFailureKind.Network, status };
  }
  if (status === UNAUTHORIZED || status === FORBIDDEN) {
    return { kind: TryOutFailureKind.NoAccess, status };
  }
  if (status === NOT_FOUND) {
    return { kind: TryOutFailureKind.NotFound, status };
  }

  return { kind: status >= SERVER_ERROR_FROM ? TryOutFailureKind.Server : TryOutFailureKind.Rejected, status };
};
