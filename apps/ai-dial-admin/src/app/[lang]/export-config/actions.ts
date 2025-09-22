'use server';

import { cookies, headers } from 'next/headers';

import {
  adaptersApi,
  applicationRunnersApi,
  applicationsApi,
  interceptorsApi,
  interceptorTemplatesApi,
  keysApi,
  modelsApi,
  rolesApi,
  routesApi,
  toolSetsApi,
  utilityApi,
} from '@/src/app/api/api';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportRequest } from '@/src/models/export';
import { EntityType } from '@/src/types/entity-type';
import { ExportFormat, ExportType } from '@/src/types/export';
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
  getTemplatesForEntitiesGrid,
  getToolsetsForEntitiesGrid,
} from '@/src/utils/entities/entities-list-view';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const exportedEntity = {
  $type: ExportType.Custom,
  exportFormat: ExportFormat.CORE,
  componentTypes: [],
};
export async function getCoreEntity(name: string, type: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await utilityApi.getCoreEntity({ ...exportedEntity, components: [{ type, name }] }, token);
}

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

  if (type === EntityType.MODEL) {
    const models = await modelsApi.getModelsList(token);
    return getModelsForEntitiesGrid(models);
  }

  if (type === EntityType.APPLICATION) {
    const applications = await applicationsApi.getApplicationsList(token);
    return getApplicationsForEntitiesGrid(applications);
  }

  if (type === EntityType.TOOLSET) {
    const toolsets = await toolSetsApi.getToolsetList(token);
    return getToolsetsForEntitiesGrid(toolsets);
  }

  if (type === EntityType.ROUTE) {
    const routes = await routesApi.getRoutesList(token);
    return getRoutesForEntitiesGrid(routes);
  }

  if (type === EntityType.INTERCEPTOR_RUNNER) {
    const runners = await interceptorTemplatesApi.getInterceptorTemplatesList(token);
    return getTemplatesForEntitiesGrid(runners);
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
