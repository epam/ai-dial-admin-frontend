import { JWT } from 'next-auth/jwt';

import { DialRoute } from '@/src/models/dial/route';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const ROUTES_URL = `${API}/routes`;
export const ROUTE_URL = (name?: string) => `${ROUTES_URL}/${name}`;

export class RoutesApi extends BaseApi {
  getRoutesList(token: JWT | null): Promise<DialRoute[] | null> {
    return this.get(ROUTES_URL, token);
  }

  getRoute(name: string, token: JWT | null): Promise<DialRoute | null> {
    return this.get(ROUTE_URL(name), token);
  }

  removeRoute(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(ROUTE_URL(name), token);
  }

  createRoute(routes: DialRoute, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(ROUTES_URL, routes, token);
  }

  updateRoute(routes: DialRoute, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(ROUTE_URL(routes.name), routes, token);
  }
}
