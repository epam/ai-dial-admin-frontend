'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, configFileApi, deploymentConfigurationApi } from '@/src/app/api/api';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Core rejects `status`/`validationWarnings` on write — they are read-only projections it adds on a
 * rejected read (see `DialModelResourceStatus`/`CoreValidationWarning`) — and never round-trips
 * `path`/`folderId`, which are derived from the resource name rather than stored.
 */
function toInterceptorPayload(interceptor: DialInterceptorResource) {
  const {
    status: __status,
    validationWarnings: __validationWarnings,
    path: __path,
    folderId: __folderId,
    ...payload
  } = interceptor;
  return payload;
}

export async function getInterceptors(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.INTERCEPTOR, path);
}

export async function createInterceptor(interceptor: DialInterceptorResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.INTERCEPTOR, interceptor.name, toInterceptorPayload(interceptor));
}

export async function getInterceptor(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialInterceptorResource>(token, ResourceType.INTERCEPTOR, path, etag);
}

export async function updateInterceptor(interceptor: DialInterceptorResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.INTERCEPTOR, interceptor.name, toInterceptorPayload(interceptor), { etag });
}

export async function removeInterceptor(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.INTERCEPTOR, path, etag);
}

export async function bulkDeleteInterceptors(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.INTERCEPTOR, paths);
}

export async function getInterceptorConfigurationSchema(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return deploymentConfigurationApi.getConfigurationSchema(token, name);
}

/** `config-file-entity-views`: the interceptor names Core's config file declares. */
export async function getConfigFileInterceptors() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.Interceptors);
}

/** `config-file-entity-views`: reads an interceptor by name from Core's config-file population directly. */
export async function getConfigFileInterceptor(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialInterceptor>(token, ConfigFileEntityType.Interceptors, name);
}
