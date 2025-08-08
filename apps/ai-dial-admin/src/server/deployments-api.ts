import { JWT } from 'next-auth/jwt';

import { API } from './api';
import { BaseApi } from './base-api';
import { Container } from '@/src/models/deployments';

export const BASE_CONTAINERS_URL = `${API}/deployments`;

export class DeploymentsApi extends BaseApi {
  getInterceptorContainers(token: JWT | null): Promise<Container[] | null> {
    return this.get(`${BASE_CONTAINERS_URL}?imageDefinitionType=INTERCEPTOR`, token);
  }
}
