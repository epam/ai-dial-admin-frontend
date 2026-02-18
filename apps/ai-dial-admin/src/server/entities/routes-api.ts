import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { Token } from '@/src/models/auth';
import { DialRoute } from '@/src/models/dial/route';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const ROUTES_URL = `${API}/routes`;
export const ROUTE_URL = (name?: string) => `${ROUTES_URL}/${name || ''}`;
export const CORE_ROUTE_URL = (name: string) => `${ROUTES_URL}/core/${name}`;

export class RoutesApi extends BaseApi {
  getRoutesList(token: Token | undefined): Promise<DialRoute[] | null> {
    return this.get(ROUTES_URL, token);
  }

  getRoute(name: string, token: Token | undefined, eTag: string) {
    return this.getActionWithEtag(ROUTE_URL(name), eTag, token);
  }

  removeRoute(token: Token | undefined, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ROUTE_URL(name), token);
  }

  createRoute(route: DialRoute, token: Token | undefined): Promise<ServerActionResponse> {
    return this.postAction(ROUTES_URL, route, token);
  }

  updateRoute(route: DialRoute, token: Token | undefined, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(ROUTE_URL(encodeURIComponent(route.name || '')), route, token, eTag);
  }

  getCoreRoute(name: string, token: Token | undefined) {
    return this.getActionWithEtag(CORE_ROUTE_URL(name), DEFAULT_ETAG, token);
  }

  updateCoreRoute(
    route: DialRoute,
    name: string,
    eTag: string,
    token: Token | undefined,
  ): Promise<ServerActionResponse> {
    return this.putActionWithEtag(CORE_ROUTE_URL(encodeURIComponent(name)), route, token, eTag);
  }
}
