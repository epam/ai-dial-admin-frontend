import { DialRoute, RouteOutput } from '@/src/models/dial/route';

export const removeEmptyValues = (route: DialRoute) => {
  if (route.paths) {
    route = {
      ...route,
      paths: route.paths?.filter((p) => Boolean(p)),
    };
  }
  if (route.upstreams) {
    route = {
      ...route,
      upstreams: route.upstreams.filter((u) => Boolean(u.endpoint)),
    };
  }
  return route;
};

export const handleRouteOutputChange = (route: DialRoute, output: string) => {
  if (output === RouteOutput.RESPONSE) {
    return {
      ...route,
      upstreams: void 0,
      response: {
        body: '',
        status: void 0,
      },
    };
  }
  return {
    ...route,
    upstreams: [
      {
        endpoint: '',
        key: void 0,
      },
    ],
    response: void 0,
  };
};
