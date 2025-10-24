import { JWT } from 'next-auth/jwt';

import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ServerActionResponse } from '@/src/models/server-action';
import { RJSFSchema } from '@rjsf/utils';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const INTERCEPTORS_URL = `${API}/interceptors`;
export const INTERCEPTOR_URL = (name?: string) => `${INTERCEPTORS_URL}/${name}`;
export const CONFIGURATION_URL = (name: string) => `${API}/deployments/${name}/configuration`;

export class InterceptorsApi extends BaseApi {
  getInterceptorsList(token: JWT | null): Promise<DialInterceptor[] | null> {
    return this.get(INTERCEPTORS_URL, token);
  }

  getInterceptor(name: string, token: JWT | null, eTag: string) {
    return this.getActionWithEtag(INTERCEPTOR_URL(name), eTag, token);
  }

  removeInterceptor(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(INTERCEPTOR_URL(name), token);
  }

  createInterceptor(interceptor: DialInterceptor, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(INTERCEPTORS_URL, interceptor, token);
  }

  updateInterceptor(interceptor: DialInterceptor, token: JWT | null, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(
      INTERCEPTOR_URL(encodeURIComponent(interceptor.name || '')),
      interceptor,
      token,
      eTag,
    );
  }

  getConfigurationSchema(name: string, token: JWT | null): Promise<RJSFSchema | null> {
    return this.get(CONFIGURATION_URL(name), token);
  }
}
