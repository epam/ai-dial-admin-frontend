import { DialAppRoute } from '@/src/models/dial/route';

export const getAppRoutes = (routes: DialAppRoute[] | undefined) => {
  if (!routes) return undefined;
  if (!Array.isArray(routes)) return [];
  return routes.map((route) => ({
    ...route,
    name: route.displayName || route.name,
    paths: clearEmptyAppRoutes(route.paths),
    attachmentPaths: {
      requestBody: clearEmptyAppRoutes(route.attachmentPaths?.requestBody),
      responseBody: clearEmptyAppRoutes(route.attachmentPaths?.responseBody),
    },
  }));
};

const clearEmptyAppRoutes = (values: string[] | undefined) => {
  return values?.filter((value) => value !== '') || [];
};
