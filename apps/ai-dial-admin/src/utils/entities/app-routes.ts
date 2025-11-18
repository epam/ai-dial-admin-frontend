import { DialAppRoute } from '@/src/models/dial/route';

export const getAppRoutes = (routes: DialAppRoute[] | undefined) => {
  return routes?.map((route) => ({ ...route, name: route.displayName || route.name }));
};
