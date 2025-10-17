import { EntityType } from '@/src/types/entity-type';
import { ApplicationRoute } from '@/src/types/routes';
import { BaseEntity } from '@/src/models/dial/base-entity';

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

export const getFileFromEntity = (route: ApplicationRoute, entity: BaseEntity) => {
  switch (route) {
    case ApplicationRoute.Models:
      return { models: { [entity.name as string]: entity } };
    case ApplicationRoute.Applications:
      return { applications: { [entity.name as string]: entity } };
    case ApplicationRoute.Toolsets:
      return { toolsets: { [entity.name as string]: entity } };
    case ApplicationRoute.Routes:
      return { routes: { [entity.name as string]: entity } };
    case ApplicationRoute.Roles:
      return { roles: { [entity.name as string]: entity } };
    case ApplicationRoute.Keys:
      return { keys: { [entity.name as string]: entity } };
    case ApplicationRoute.ApplicationRunners:
      return { applicationTypeSchemas: [entity] };
    case ApplicationRoute.Interceptors:
      return { interceptors: { [entity.name as string]: entity } };

    default:
      return {};
  }
};
