import { JWT } from 'next-auth/jwt';

import { DialInterceptor } from '@/src/models/dial/interceptor';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const INTERCEPTORS_URL = `${API}/interceptors`;
export const INTERCEPTOR_URL = (name?: string) => `${INTERCEPTORS_URL}/${name}`;

export class InterceptorsApi extends BaseApi {
  getInterceptorsList(token: JWT | null): Promise<DialInterceptor[] | null> {
    return this.get(INTERCEPTORS_URL, token);
  }

  getInterceptor(name: string, token: JWT | null): Promise<DialInterceptor | null> {
    return this.get(INTERCEPTOR_URL(name), token);
  }

  removeInterceptor(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(INTERCEPTOR_URL(name), token);
  }

  createInterceptor(interceptors: DialInterceptor, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(INTERCEPTORS_URL, interceptors, token);
  }

  updateInterceptor(interceptors: DialInterceptor, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(INTERCEPTOR_URL(interceptors.name), interceptors, token);
  }
}
