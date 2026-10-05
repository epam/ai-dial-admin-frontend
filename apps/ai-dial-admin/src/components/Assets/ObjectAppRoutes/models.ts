import { DialAppRoute } from '@/src/models/dial/route';

export enum ObjectAppRouteFormat {
  AssetApplication = 'asset-application',
  AppRunner = 'app-runner',
}

export type ObjectAppRoutes = Record<string, Record<string, unknown>>;

export interface ObjectAppRouteMapper {
  toRoute: (name: string, route: Record<string, unknown>) => DialAppRoute;
  fromRoute: (route: DialAppRoute, previousRoute?: Record<string, unknown>) => Record<string, unknown>;
}
