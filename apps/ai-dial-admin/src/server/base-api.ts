import { JWT } from 'next-auth/jwt';

import { ServerActionResponse } from '@/src/models/server-action';
import { streamRequest } from '@/src/utils/api/create-stream-request';
import { getError, getErrorMessage, getParsedError } from '@/src/utils/api/error';
import { logger } from './logger';
import { sendRequest } from '@/src/utils/api/send-request';
import { getApiHeaders, getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { fileRequest } from '@/src/utils/api/file-request';

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

  protected async putAction<T extends object>(url: string, dto: T, token?: JWT | null): Promise<ServerActionResponse> {
    return this.sendActionRequest<T>(url, 'PUT', token, dto);
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

  protected async postFiles(url: string, dto: FormData, token?: JWT | null): Promise<ServerActionResponse> {
    return fileRequest(`${this.config.host}${url}`, getAuthorizationHeader(token), dto).then((res) =>
      this.handleResponse(res, 'POST'),
    );
  }

  protected get<R extends object>(url: string, token?: JWT | null, headers?: HeadersInit): Promise<R | null> {
    return this.sendRequest<object, R>(url, 'GET', void 0, token, headers) as Promise<R | null>;
  }

  protected head<R extends object>(url: string, token?: JWT | null, headers?: HeadersInit): Promise<R | null> {
    return this.sendRequest<object, R>(url, 'HEAD', void 0, token, headers) as Promise<R | null>;
  }

  protected getAction(url: string, token?: JWT | null): Promise<ServerActionResponse> {
    return this.sendActionRequest(url, 'GET', token);
  }

  protected streamRequest(url: string, fileName: string, token?: JWT | null, isPreview?: boolean): Promise<Response> {
    return streamRequest(`${this.config.host}${url}`, fileName, token, isPreview);
  }

  protected sendActionRequest<T extends object>(
    url: string,
    type: string,
    token?: JWT | null,
    dto?: T,
    initHeaders?: HeadersInit,
  ): Promise<ServerActionResponse> {
    return sendRequest(`${this.config.host}${url}`, type, { ...getApiHeaders(token), ...initHeaders }, dto).then(
      (res) => this.handleResponse(res, type),
    );
  }

  protected sendRequest<T extends object, R>(
    url: string,
    type: string,
    dto?: T,
    token?: JWT | null,
    initHeaders?: HeadersInit,
  ): Promise<Response | R | null> {
    return sendRequest(`${this.config.host}${url}`, type, { ...getApiHeaders(token), ...initHeaders }, dto).then(
      (res) => {
        if (isFailedRequest(res)) {
          logger.error(`Request error ${res}`);
          logger.error(`Request status ${res.status}`);
          logger.error(`Request error Url  ${res.url}`);

          return res.text().then((error) => {
            logger.error(`Request error ${res.status} ${error}`);
            return null;
          });
        }

        if (res.headers.get('content-type')?.includes('application/octet-stream')) {
          return res;
        }

        return getResponse<R>(type, res);
      },
    );
  }

  private handleResponse(res: Response, type: string): Promise<ServerActionResponse> {
    if (isFailedRequest(res)) {
      logger.error(`Request error ${res}`);
      logger.error(`Request status ${res.status}`);
      logger.error(`Request error Url  ${res.url}`);

      return res.text().then((error) => {
        const errObject = getParsedError(error);
        logger.error(`Request error ${res.status}`);
        logger.error(`${errObject.error} ${errObject.message}`);

        return {
          success: false,
          errorMessage: getErrorMessage(errObject, res.status),
          errorHeader: getError(errObject),
        };
      });
    }

    return getResponse<unknown>(type, res).then((r) => {
      return { success: true, response: r };
    });
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
