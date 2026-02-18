import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ServerActionResponse } from '@/src/models/server-action';
import { RJSFSchema } from '@rjsf/utils';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const INTERCEPTORS_URL = `${API}/interceptors`;
export const INTERCEPTOR_URL = (name?: string) => `${INTERCEPTORS_URL}/${name || ''}`;
export const CORE_INTERCEPTOR_URL = (name: string) => `${INTERCEPTORS_URL}/core/${name}`;
export const CONFIGURATION_URL = (name: string) => `${API}/deployments/${name}/configuration`;

export class InterceptorsApi extends BaseApi {
  getInterceptorsList(token: Token | undefined): Promise<DialInterceptor[] | null> {
    return this.get(INTERCEPTORS_URL, token);
  }

  getInterceptorsListAction(token: Token | undefined): Promise<ServerActionResponse<DialInterceptor[]>> {
    return this.getAction(INTERCEPTORS_URL, token);
  }

  getInterceptor(name: string, token: Token | undefined, eTag: string) {
    return this.getActionWithEtag(INTERCEPTOR_URL(name), eTag, token);
  }

  removeInterceptor(token: Token | undefined, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(INTERCEPTOR_URL(name), token);
  }

  createInterceptor(interceptor: DialInterceptor, token: Token | undefined): Promise<ServerActionResponse> {
    return this.postAction(INTERCEPTORS_URL, interceptor, token);
  }

  updateInterceptor(
    interceptor: DialInterceptor,
    token: Token | undefined,
    eTag: string,
  ): Promise<ServerActionResponse> {
    return this.putActionWithEtag(
      INTERCEPTOR_URL(encodeURIComponent(interceptor.name || '')),
      interceptor,
      token,
      eTag,
    );
  }

  getConfigurationSchema(name: string, token: Token | undefined): Promise<ServerActionResponse<RJSFSchema>> {
    return this.getAction(CONFIGURATION_URL(name), token);
  }

  getCoreInterceptor(name: string, token: Token | undefined): Promise<ServerActionResponse<DialInterceptor>> {
    return this.getActionWithEtag(CORE_INTERCEPTOR_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreInterceptor(
    interceptor: DialInterceptor,
    name: string,
    etag: string,
    token: Token | undefined,
  ): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_INTERCEPTOR_URL(encodeURIComponent(name)), interceptor, token, etag);
  }
}
