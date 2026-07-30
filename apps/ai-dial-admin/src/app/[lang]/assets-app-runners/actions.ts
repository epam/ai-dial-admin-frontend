'use server';

import { cookies, headers } from 'next/headers';

import { appRunnerSchemaApi, assetApi } from '@/src/app/api/api';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { toCoreAppRoutes } from '@/src/utils/app-runners/core-app-routes';
import { isValidRunnerId, toCoreRunnerName } from '@/src/utils/app-runners/core-runner-name';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const INVALID_ID_ERROR: ServerActionResponse = {
  success: false,
  errorHeader: 'Invalid application runner id',
  errorMessage: "The id must not contain any of the characters ! ~ * ' ( ), which DIAL Core cannot store.",
};

/**
 * Core stores this resource's body verbatim (`WriteSpec.entityClass == null`), so anything sent
 * persists permanently in the stored schema — including the `name` and `status` Core itself injects
 * on read, which would then break meta-schema conformance. Everything not part of the schema is
 * dropped here rather than relying on Core to filter it.
 */
function toRunnerPayload(runner: DialAppRunnerResource) {
  const {
    name: __name,
    status: __status,
    path: __path,
    folderId: __folderId,
    author: __author,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    'dial:applicationTypeRoutes': routes,
    ...payload
  } = runner;
  const coreRoutes = toCoreAppRoutes(routes);
  return {
    ...payload,
    ...(coreRoutes && { 'dial:applicationTypeRoutes': coreRoutes }),
  };
}

export async function getRunners(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.APP_TYPE_SCHEMA, path);
}

export async function createRunner(runner: DialAppRunnerResource): Promise<ServerActionResponse> {
  if (!isValidRunnerId(runner.$id)) {
    return INVALID_ID_ERROR;
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(
    token,
    ResourceType.APP_TYPE_SCHEMA,
    toCoreRunnerName(runner.$id as string),
    toRunnerPayload(runner),
  );
}

export async function getRunner(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialAppRunnerResource>(token, ResourceType.APP_TYPE_SCHEMA, path, etag);
}

export async function updateRunner(runner: DialAppRunnerResource, etag: string): Promise<ServerActionResponse> {
  if (!isValidRunnerId(runner.$id)) {
    return INVALID_ID_ERROR;
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(
    token,
    ResourceType.APP_TYPE_SCHEMA,
    toCoreRunnerName(runner.$id as string),
    toRunnerPayload(runner),
    { etag },
  );
}

export async function removeRunner(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.APP_TYPE_SCHEMA, path, etag);
}

export async function bulkDeleteRunners(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.APP_TYPE_SCHEMA, paths);
}

export async function getResolvedRunnerSchema(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return appRunnerSchemaApi.resolvedSchema(token, name);
}
