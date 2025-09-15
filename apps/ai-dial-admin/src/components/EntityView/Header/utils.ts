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

export const getEntityFromFile = (
  route: ApplicationRoute,
  name: string,
  file: Record<string, Record<string, object>>,
) => {
  switch (route) {
    case ApplicationRoute.Models:
      return (file as { models: Record<string, object> }).models[name];
    case ApplicationRoute.Applications:
      return (file as { applications: Record<string, object> }).applications[name];
    case ApplicationRoute.Toolsets:
      return (file as { toolsets: Record<string, object> }).toolsets[name];
    case ApplicationRoute.Routes:
      return (file as { routes: Record<string, object> }).routes[name];
    case ApplicationRoute.Roles:
      return (file as { roles: Record<string, object> }).roles[name];
    case ApplicationRoute.Keys:
      return (file as { keys: Record<string, object> }).keys[name];
    case ApplicationRoute.ApplicationRunners:
      return (file as { applicationTypeSchemas: Record<string, object> }).applicationTypeSchemas[name];
    case ApplicationRoute.Interceptors:
      return (file as { interceptors: Record<string, object> }).interceptors[name];
    default:
      return '';
  }
};
