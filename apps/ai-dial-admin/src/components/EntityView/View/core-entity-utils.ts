import { EntityType } from '@/src/types/entity-type';
import { ApplicationRoute } from '@/src/types/routes';
import { BaseEntity } from '../../../models/dial/base-entity';

interface FileRecord {
  models?: Record<string, object>;
  applications?: Record<string, object>;
  toolsets?: Record<string, object>;
  routes?: Record<string, object>;
  roles?: Record<string, object>;
  keys?: Record<string, object>;
  applicationTypeSchemas?: Record<string, object>;
  interceptors?: Record<string, object>;
}

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

export const getFileFromEntity = (route: ApplicationRoute, entity: BaseEntity): FileRecord => {
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
      return { applicationTypeSchemas: { [entity.name as string]: entity } };
    case ApplicationRoute.Interceptors:
      return { interceptors: { [entity.name as string]: entity } };

    default:
      return {};
  }
};

export const getEntityFromFile = (route: ApplicationRoute, name: string, file: FileRecord) => {
  switch (route) {
    case ApplicationRoute.Models:
      return file.models?.[name];
    case ApplicationRoute.Applications:
      return file.applications?.[name];
    case ApplicationRoute.Toolsets:
      return file.toolsets?.[name];
    case ApplicationRoute.Routes:
      return file.routes?.[name];
    case ApplicationRoute.Roles:
      return file.roles?.[name];
    case ApplicationRoute.Keys:
      return file.keys?.[name];
    case ApplicationRoute.ApplicationRunners:
      return file.applicationTypeSchemas?.[name];
    case ApplicationRoute.Interceptors:
      return file.interceptors?.[name];
    default:
      return '';
  }
};
