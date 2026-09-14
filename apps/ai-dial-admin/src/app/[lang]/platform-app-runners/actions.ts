'use server';

import { cookies, headers } from 'next/headers';

import { appRunnerSchemaApi, assetApi, configFileApi } from '@/src/app/api/api';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { toCoreAppRoutes } from '@/src/utils/app-runners/core-app-routes';
import { CORE_UNENCODABLE_ID_CHARS } from '@/src/utils/app-runners/constants';
import { hasUnencodableRunnerIdChars, toCoreRunnerName } from '@/src/utils/app-runners/core-runner-name';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const MISSING_ID_ERROR: ServerActionResponse = {
  success: false,
  errorHeader: 'Missing application runner id',
  errorMessage: 'An application runner needs an id — it becomes the resource name DIAL Core stores it under.',
};

const INVALID_ID_ERROR: ServerActionResponse = {
  success: false,
  errorHeader: 'Invalid application runner id',
  errorMessage: `The id must not contain any of the characters ${CORE_UNENCODABLE_ID_CHARS.join(
    ' ',
  )}, which DIAL Core cannot store.`,
};

const checkRunnerId = (id?: string): ServerActionResponse | null => {
  if (!id) {
    return MISSING_ID_ERROR;
  }
  return hasUnencodableRunnerIdChars(id) ? INVALID_ID_ERROR : null;
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

export async function getAllRunners() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.APP_TYPE_SCHEMA, '');
}

export async function createRunner(runner: DialAppRunnerResource): Promise<ServerActionResponse> {
  const idError = checkRunnerId(runner.$id);
  if (idError) {
    return idError;
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
  const idError = checkRunnerId(runner.$id);
  if (idError) {
    return idError;
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

/** `config-file-entity-views`: the App Runner names Core's config file declares (`schemas` type). */
export async function getConfigFileAppRunners() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.Schemas);
}

/** `config-file-entity-views`: reads an App Runner by id from Core's config-file `schemas` population directly. */
export async function getConfigFileAppRunner(id: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialApplicationScheme>(token, ConfigFileEntityType.Schemas, id);
}
