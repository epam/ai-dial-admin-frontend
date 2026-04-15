import { DEFAULT_ETAG, IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { streamRequest } from '@/src/utils/api/create-stream-request';
import { ErrorObject, getError, getErrorMessage, getParsedError } from '@/src/utils/api/error';
import { fileRequest } from '@/src/utils/api/file-request';
import { sendRequest } from '@/src/utils/api/send-request';
import { getApiHeaders, getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { requestRegistry } from '@/src/utils/api/request-registry';
import { errorLog } from './logger';
import { normalizeUrl } from '../utils/url';

export interface BaseApiConfig {
  host?: string;
}

export class BaseApi {
  protected config: BaseApiConfig;

  constructor(config: BaseApiConfig) {
    this.config = { ...config, host: normalizeUrl(config.host) };
  }

  protected async deleteAction(url: string, token?: Token): Promise<ServerActionResponse> {
    return this.sendActionRequest(url, 'DELETE', token);
  }

  protected async putActionWithEtag<T extends object>(
    url: string,
    dto: T,
    token: Token,
    etag: string,
  ): Promise<ServerActionResponse> {
    return this.putAction<T>(url, dto, token, { [IF_MATCH]: etag || DEFAULT_ETAG });
  }

  protected async putAction<T extends object>(
    url: string,
    dto: T,
    token?: Token,
    initHeaders?: HeadersInit,
  ): Promise<ServerActionResponse> {
    return this.sendActionRequest<T>(url, 'PUT', token, dto, initHeaders);
  }

  protected async post<T extends object, R>(
    url: string,
    dto: T,
    token?: Token,
    initHeaders?: HeadersInit,
  ): Promise<R | null> {
    return this.sendRequest<object, R>(url, 'POST', dto, token, initHeaders) as Promise<R | null>;
  }

  protected async postAction<T extends object>(
    url: string,
    dto: T,
    token?: Token,
    initHeaders?: HeadersInit,
  ): Promise<ServerActionResponse> {
    return this.sendActionRequest<T>(url, 'POST', token, dto, initHeaders);
  }

  protected async postFiles(url: string, dto: FormData, token?: Token, method?: string): Promise<ServerActionResponse> {
    return fileRequest(`${this.config.host || ''}${url}`, getAuthorizationHeader(token), dto, method).then((res) => {
      return this.handleResponse(res, method || 'POST');
    });
  }

  protected get<R extends object>(url: string, token?: Token, headers?: HeadersInit): Promise<R | null> {
    return this.sendRequest<object, R>(url, 'GET', void 0, token, headers) as Promise<R | null>;
  }

  protected head<R extends object>(url: string, token?: Token, headers?: HeadersInit): Promise<R | null> {
    return this.sendRequest<object, R>(url, 'HEAD', void 0, token, headers) as Promise<R | null>;
  }

  protected getActionWithEtag(url: string, etag: string, token?: Token): Promise<ServerActionResponse> {
    return this.sendActionRequest(url, 'GET', token, void 0, { [IF_NONE_MATCH]: etag });
  }

  protected getActionWithMatchEtag(url: string, etag: string, token?: Token): Promise<ServerActionResponse> {
    return this.sendActionRequest(url, 'GET', token, void 0, { [IF_MATCH]: etag });
  }

  protected getAction(url: string, token?: Token): Promise<ServerActionResponse> {
    return this.sendActionRequest(url, 'GET', token);
  }

  protected streamRequest(url: string, fileName: string, token?: Token, isPreview?: boolean): Promise<Response> {
    return streamRequest(`${this.config.host || ''}${url}`, fileName, token, isPreview);
  }

  protected async sendActionRequest<T extends object>(
    url: string,
    type: string,
    token?: Token,
    dto?: T,
    initHeaders?: HeadersInit,
  ): Promise<ServerActionResponse> {
    const requestId = crypto.randomUUID();
    const controller = requestRegistry.register(requestId);

    try {
      const res = await sendRequest(
        `${this.config.host || ''}${url}`,
        type,
        { ...getApiHeaders(token), ...initHeaders },
        dto,
        controller.signal,
      );
      return this.handleResponse(res, type);
    } catch (error) {
      // Request cancelled during logout, this is expected
      if ((error as Error).name === 'AbortError') {
        return {
          success: false,
          status: 0,
          errorMessage: 'Request cancelled',
        };
      }
      throw error;
    } finally {
      requestRegistry.unregister(requestId);
    }
  }

  protected async sendRequest<T extends object, R>(
    url: string,
    type: string,
    dto?: T,
    token?: Token,
    initHeaders?: HeadersInit,
  ): Promise<Response | R | null | undefined> {
    const requestId = crypto.randomUUID();
    const controller = requestRegistry.register(requestId);

    try {
      const res = await sendRequest(
        `${this.config.host || ''}${url}`,
        type,
        { ...getApiHeaders(token), ...initHeaders },
        dto,
        controller.signal,
      );

      if (isFailedRequest(res)) {
        const traceparent = res.headers.get('traceparent');
        errorLog(`Request status ${res.status}`);
        errorLog(`Request error Url  ${res.url}`);
        errorLog(`Request error traceparent  ${traceparent}`);

        if (res.status === 403) {
          return void 0;
        }

        return res.text().then((error) => {
          errorLog(`Request error ${res.status} ${error}`);
          return null;
        });
      }

      if (res.headers.get('content-type')?.includes('application/octet-stream')) {
        return res;
      }

      return getResponse<R>(type, res);
    } catch (error) {
      // Request cancelled during logout, this is expected
      if ((error as Error).name === 'AbortError') {
        return null;
      }
      throw error;
    } finally {
      requestRegistry.unregister(requestId);
    }
  }

  private handleResponse(res: Response, type: string): Promise<ServerActionResponse> {
    const etag = res.headers.get('etag') || undefined;

    if (isFailedRequest(res)) {
      this.setLoggerRequestInfoError(res);

      return res.text().then((error) => {
        const errObject = getParsedError(error);
        this.setLoggerRequestError(error, res);
        return {
          success: false,
          errorMessage: getErrorMessage(errObject, res.status),
          errorHeader: getError(errObject),
          status: res.status,
          requestId: res.headers.get('traceparent') as string | undefined,
          etag,
        };
      });
    }

    return getResponse<unknown>(type, res).then((r) => {
      if ((r as ErrorObject).error) {
        return {
          success: false,
          errorMessage: getErrorMessage(r as ErrorObject, res.status),
          errorHeader: getError(r as ErrorObject),
          status: res.status,
          requestId: res.headers.get('traceparent') as string | undefined,
          etag,
        };
      }
      return { success: true, response: r, etag };
    });
  }

  private setLoggerRequestInfoError(res: Response) {
    errorLog(`Request status ${res.status}`);
    errorLog(`Request error Url  ${res.url}`);
  }

  private setLoggerRequestError(error: string, res: Response) {
    const errObject = getParsedError(error);
    errorLog(`Request error ${res.status}`);
    errorLog(`${errObject.error} ${errObject.message}`);
  }
}

const isFailedRequest = (res: Response) => {
  return !(res.status >= 200 && res.status < 300);
};

const getResponse = <T>(type: string, res: Response) => {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/plain')) {
    return res.text() as Promise<T>;
  }

  return (type === 'DELETE' ? res.text() : res.json().catch(() => res.text().catch(() => ''))) as Promise<T>;
};
