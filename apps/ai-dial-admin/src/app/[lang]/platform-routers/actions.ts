'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { DialRouterResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { stripMetadata } from '@/src/server/assets/exim';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Core's `Router` carries `name`/`author`/`createdAt`/`updatedAt` through `Deployment`, so they stay in
 * the payload; everything the merge layer grafts nests under `_metadata`, which `stripMetadata` drops.
 */
function toRouterPayload(router: DialRouterResource) {
  return stripMetadata(router);
}

export async function getRouters(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.ROUTER, path);
}

export async function createRouter(router: DialRouterResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.ROUTER, router.name, toRouterPayload(router));
}

export async function getRouter(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialRouterResource>(token, ResourceType.ROUTER, path, etag);
}

export async function updateRouter(router: DialRouterResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.ROUTER, router.name, toRouterPayload(router), { etag });
}

export async function removeRouter(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.ROUTER, path, etag);
}

export async function bulkDeleteRouters(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.ROUTER, paths);
}

export async function getConfigFileRouters() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.Routers);
}

export async function getConfigFileRouter(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialRouterResource>(token, ConfigFileEntityType.Routers, name);
}
