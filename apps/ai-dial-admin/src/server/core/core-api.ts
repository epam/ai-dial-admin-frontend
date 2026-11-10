import type { DIAL_SDK } from '@epam/ai-dial-typescript-sdk';

import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { BaseApi } from '@/src/server/base-api';
import { errorLog } from '@/src/server/logger';
import { ErrorObject, getError, getErrorMessage } from '@/src/utils/api/error';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { normalizeCoreError } from './error';
import { CoreSdkCall, CoreSdkResult } from './models';
import { getCoreSdk } from './sdk-client';

/**
 * Base client for calling DIAL Core directly (instead of the admin backend).
 *
 * Reuses the shared request pipeline and JWT-Bearer auth from {@link BaseApi};
 * the host is `DIAL_CORE_API_URL`. The only behavioral difference is error
 * normalization (R3/D9): Core returns plain-text or nested error bodies that the
 * admin backend used to flatten, so we reproduce that flattening here.
 *
 * Calls migrated to `@epam/ai-dial-typescript-sdk` go through {@link sdkAction} / {@link sdkGet}, which
 * reproduce `BaseApi`'s two return contracts so a caller cannot tell which path served it.
 */
export class CoreApi extends BaseApi {
  protected parseErrorBody(error: string, status: number): ErrorObject {
    return normalizeCoreError(error, status);
  }

  protected get sdk(): DIAL_SDK {
    return getCoreSdk(this.config.host);
  }

  /** SDK counterpart of `getAction` and friends: resolves to the same envelope `handleResponse` builds. */
  protected async sdkAction<T extends object = object>(
    token: Token | undefined,
    call: CoreSdkCall,
  ): Promise<ServerActionResponse<T>> {
    const result = await runSdkCall(token, call);
    if (!result) {
      return { success: false, status: 0, errorMessage: 'Request cancelled' };
    }

    const { data, error, response } = result;
    const etag = response.headers.get('etag') || undefined;

    if (!response.ok) {
      const body = serializeErrorBody(error);
      this.setLoggerRequestInfoError(response);
      this.setLoggerRequestError(body, response);
      return this.toFailure(this.parseErrorBody(body, response.status), response, etag);
    }

    const parsed = parseSdkBody(data, response);
    if ((parsed as ErrorObject | null)?.error) {
      return this.toFailure(parsed as ErrorObject, response, etag);
    }

    return { success: true, response: parsed as T, etag };
  }

  /**
   * SDK counterpart of `get`: the parsed body, `undefined` on 403, `null` on any other failure or abort.
   * Typed `R | null` like `get`, which hides the 403 `undefined` behind the same cast.
   */
  protected sdkGet<R extends object>(token: Token | undefined, call: CoreSdkCall): Promise<R | null> {
    return this.sdkValue<R>(token, call) as Promise<R | null>;
  }

  private async sdkValue<R>(token: Token | undefined, call: CoreSdkCall): Promise<R | null | undefined> {
    const result = await runSdkCall(token, call);
    if (!result) {
      return null;
    }

    const { data, error, response } = result;

    if (!response.ok) {
      errorLog(`Request status ${response.status}`);
      errorLog(`Request error Url  ${response.url}`);
      errorLog(`Request error traceparent  ${response.headers.get('traceparent')}`);

      if (response.status === 403) {
        return undefined;
      }

      errorLog(`Request error ${response.status} ${serializeErrorBody(error)}`);
      return null;
    }

    return parseSdkBody(data, response) as R;
  }

  private toFailure<T extends object>(
    errObject: ErrorObject,
    response: Response,
    etag: string | undefined,
  ): ServerActionResponse<T> {
    return {
      success: false,
      errorMessage: getErrorMessage(errObject, response.status),
      errorHeader: getError(errObject),
      status: response.status,
      requestId: response.headers.get('traceparent') || undefined,
      etag,
    };
  }
}

/** `null` means the request was aborted (logout or the caller's own signal); anything else rethrows. */
const runSdkCall = async (token: Token | undefined, call: CoreSdkCall): Promise<CoreSdkResult | null> => {
  try {
    return await call({ headers: getAuthorizationHeader(token), parseAs: 'text' });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return null;
    }
    throw error;
  }
};

/**
 * `openapi-fetch` has already read a failed body and tried `JSON.parse` on it, while `normalizeCoreError`
 * takes the raw text. An empty-body failure (204, `Content-Length: 0`) leaves `error` undefined.
 */
const serializeErrorBody = (error: unknown): string => {
  if (error == null) {
    return '';
  }

  return typeof error === 'string' ? error : JSON.stringify(error);
};

/** `BaseApi`'s `getResponse` rule over a text body: `text/plain` stays text, the rest is JSON when it parses. */
const parseSdkBody = (raw: unknown, response: Response): unknown => {
  if (typeof raw !== 'string') {
    return raw ?? '';
  }

  if (response.headers.get('content-type')?.includes('text/plain')) {
    return raw;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};
