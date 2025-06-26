'use server';

import { cookies, headers } from 'next/headers';

import {
  adaptersApi,
  applicationRunnersApi,
  applicationsApi,
  interceptorsApi,
  keysApi,
  modelsApi,
  rolesApi,
  routesApi,
  utilityApi,
} from '@/src/app/api/api';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportRequest } from '@/src/models/export';
import { EntityType } from '@/src/types/entity-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import {
  getAdaptersForEntitiesGrid,
  getApplicationsForEntitiesGrid,
  getInterceptorsForEntitiesGrid,
  getKeysForEntitiesGrid,
  getModelsForEntitiesGrid,
  getRolesForEntitiesGrid,
  getRoutesForEntitiesGrid,
  getRunnersForEntitiesGrid,
} from '@/src/utils/entities/entities-list-view';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function exportConfig(exportConfig: ExportRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await utilityApi.exportConfig(exportConfig, token);
}

export async function exportConfigMap() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await utilityApi.exportConfigMap(token);
}

export async function previewExportConfig(exportConfig: ExportRequest) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  return await utilityApi.previewExportConfig(exportConfig, token);
}

export async function getEntities(type: string): Promise<EntitiesGridData[]> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  if (type === EntityType.ENTITIES) {
    const [routes, applications, models] = await Promise.all([
      routesApi.getRoutesList(token),
      applicationsApi.getApplicationsList(token),
      modelsApi.getModelsList(token),
    ]);
    return [
      ...getModelsForEntitiesGrid(models),
      ...getApplicationsForEntitiesGrid(applications),
      ...getRoutesForEntitiesGrid(routes),
    ];
  }
  if (type === EntityType.ROLE) {
    const roles = await rolesApi.getRolesList(token);
    return getRolesForEntitiesGrid(roles);
  }
  if (type === EntityType.KEY) {
    const keys = await keysApi.getKeysList(token);
    return getKeysForEntitiesGrid(keys);
  }
  if (type === EntityType.APPLICATION_TYPE_SCHEMA) {
    const runners = await applicationRunnersApi.getApplicationSchemesList(token);
    return getRunnersForEntitiesGrid(runners);
  }
  if (type === EntityType.INTERCEPTOR) {
    const interceptors = await interceptorsApi.getInterceptorsList(token);
    return getInterceptorsForEntitiesGrid(interceptors);
  }
  if (type === EntityType.ADAPTER) {
    const adapters = await adaptersApi.getAdaptersList(token);
    return getAdaptersForEntitiesGrid(adapters);
  }
  return [];
}
