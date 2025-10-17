import { EntityType } from '@/src/types/entity-type';
import { ApplicationRoute } from '@/src/types/routes';

export const getExportType = (route: ApplicationRoute): string => {
  switch (route) {
    case ApplicationRoute.Models:
      return EntityType.MODEL;
    case ApplicationRoute.Applications:
      return EntityType.APPLICATION;
    case ApplicationRoute.Toolsets:
      return EntityType.TOOLSET;
    case ApplicationRoute.Routes:
      return EntityType.ROUTE;
    case ApplicationRoute.Roles:
      return EntityType.ROLE;
    case ApplicationRoute.Keys:
      return EntityType.KEY;
    case ApplicationRoute.ApplicationRunners:
      return EntityType.APPLICATION_TYPE_SCHEMA;
    case ApplicationRoute.Interceptors:
      return EntityType.INTERCEPTOR;
    default:
      return '';
  }
};
