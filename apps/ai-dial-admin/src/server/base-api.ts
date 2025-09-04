import { JWT } from 'next-auth/jwt';

import { ServerActionResponse } from '@/src/models/server-action';
import { streamRequest } from '@/src/utils/api/create-stream-request';
import { getError, getErrorMessage, getParsedError } from '@/src/utils/api/error';
import { logger } from './logger';
import { sendRequest } from '@/src/utils/api/send-request';
import { getApiHeaders, getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { fileRequest } from '@/src/utils/api/file-request';
import { DEFAULT_ETAG, IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';

export interface BaseApiConfig {
  host?: string;
}

export class BaseApi {
  protected config: BaseApiConfig;

  constructor(config: BaseApiConfig) {
    this.config = config;
  }

  protected async deleteAction(url: string, token?: JWT | null): Promise<ServerActionResponse> {
    return this.sendActionRequest(url, 'DELETE', token);
  }

  protected async putActionWithEtag<T extends object>(
    url: string,
    dto: T,
    token?: JWT | null,
    etag?: string,
  ): Promise<ServerActionResponse> {
    return this.putAction<T>(url, dto, token, { [IF_MATCH]: etag || DEFAULT_ETAG });
  }

  protected async putAction<T extends object>(
    url: string,
    dto: T,
    token?: JWT | null,
    initHeaders?: HeadersInit,
  ): Promise<ServerActionResponse> {
    return this.sendActionRequest<T>(url, 'PUT', token, dto, initHeaders);
  }

  protected async post<T extends object, R>(
    url: string,
    dto: T,
    token?: JWT | null,
    initHeaders?: HeadersInit,
  ): Promise<R | null> {
    return this.sendRequest<object, R>(url, 'POST', dto, token, initHeaders) as Promise<R | null>;
  }

  protected async postAction<T extends object>(
    url: string,
    dto: T,
    token?: JWT | null,
    initHeaders?: HeadersInit,
  ): Promise<ServerActionResponse> {
    return this.sendActionRequest<T>(url, 'POST', token, dto, initHeaders);
  }

  protected async postFiles(
    url: string,
    dto: FormData,
    token?: JWT | null,
    method?: string,
  ): Promise<ServerActionResponse> {
    return fileRequest(`${this.config.host || ''}${url}`, getAuthorizationHeader(token), dto, method).then((res) => {
      return this.handleActionResponse(res, method || 'POST');
    });
  }

  protected getWithEtag<R extends object>(url: string, eTag: string, token?: JWT | null) {
    return this.sendRequest<object, R>(url, 'GET', void 0, token, { [IF_NONE_MATCH]: eTag });
  }

  protected get<R extends object>(url: string, token?: JWT | null, headers?: HeadersInit) {
    return this.sendRequest<object, R>(url, 'GET', void 0, token, headers);
  }

  protected head<R extends object>(url: string, token?: JWT | null, headers?: HeadersInit): Promise<R | null> {
    return this.sendRequest<object, R>(url, 'HEAD', void 0, token, headers) as Promise<R | null>;
  }

  protected getAction(url: string, token?: JWT | null): Promise<ServerActionResponse> {
    return this.sendActionRequest(url, 'GET', token);
  }

  protected streamRequest(url: string, fileName: string, token?: JWT | null, isPreview?: boolean): Promise<Response> {
    return streamRequest(`${this.config.host || ''}${url}`, fileName, token, isPreview);
  }

  protected sendActionRequest<T extends object>(
    url: string,
    type: string,
    token?: JWT | null,
    dto?: T,
    initHeaders?: HeadersInit,
  ): Promise<ServerActionResponse> {
    return this.sendServerRequest(url, type, token, dto, initHeaders).then((res) =>
      this.handleActionResponse(res, type),
    );
  }

  protected sendRequest<T extends object, R>(
    url: string,
    type: string,
    dto?: T,
    token?: JWT | null,
    initHeaders?: HeadersInit,
  ) {
    return this.sendServerRequest(url, type, token, dto, initHeaders).then((res) => {
      if (isFailedRequest(res)) {
        this.setLoggerRequestInfoError(res);

        if (res.status === 403) {
          return void 0;
        }

        return res.text().then((error) => {
          this.setLoggerRequestError(error, res);
          return null;
        });
      }

      if (res.headers.get('content-type')?.includes('application/octet-stream')) {
        return { res };
      }

      return { res: getResponse<R>(type, res), headers: res.headers };
    });
  }

  protected sendServerRequest<T extends object>(
    url: string,
    type: string,
    token?: JWT | null,
    dto?: T,
    initHeaders?: HeadersInit,
  ): Promise<Response> {
    return sendRequest(`${this.config.host || ''}${url}`, type, { ...getApiHeaders(token), ...initHeaders }, dto);
  }

  private handleActionResponse(res: Response, type: string): Promise<ServerActionResponse> {
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
          etag: res.headers.get('etag') || undefined,
        };
      });
    }

    return getResponse<unknown>(type, res).then((r) => {
      return { success: true, response: r };
    });
  }

  private setLoggerRequestInfoError(res: Response) {
    logger.error(`Request status ${res.status}`);
    logger.error(`Request error Url  ${res.url}`);
  }

  private setLoggerRequestError(error: string, res: Response) {
    const errObject = getParsedError(error);
    logger.error(`Request error ${res.status}`);
    logger.error(`${errObject.error} ${errObject.message}`);
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
