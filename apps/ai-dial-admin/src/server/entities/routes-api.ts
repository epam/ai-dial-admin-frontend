import { JWT } from 'next-auth/jwt';

import { DialRoute } from '@/src/models/dial/route';
import { ServerActionResponse } from '@/src/models/server-action';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const ROUTES_URL = `${API}/routes`;
export const ROUTE_URL = (name?: string) => `${ROUTES_URL}/${name}`;
export const CORE_ROUTE_URL = (name?: string) => `${ROUTES_URL}/${name}`;

export class RoutesApi extends BaseApi {
  getRoutesList(token: JWT | null): Promise<DialRoute[] | null> {
    return this.get(ROUTES_URL, token);
  }

  getRoute(name: string, token: JWT | null, eTag: string) {
    return this.getActionWithEtag(ROUTE_URL(name), eTag || DEFAULT_ETAG, token);
  }

  removeRoute(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ROUTE_URL(name), token);
  }

  createRoute(route: DialRoute, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(ROUTES_URL, route, token);
  }

  updateRoute(route: DialRoute, token: JWT | null, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(ROUTE_URL(encodeURIComponent(route.name || '')), route, token, eTag);
  }

  getCoreRoute(name: string, token: JWT | null) {
    return this.getAction(CORE_ROUTE_URL(name), token);
  }

  updateCoreRoute(route: DialRoute, name: string, eTag: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_ROUTE_URL(encodeURIComponent(name || '')), route, token, eTag);
  }
}
