'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { DialRoute } from '@/src/models/dial/route';
import { DialRouteResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { stripMetadata } from '@/src/server/assets/exim';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Core's `Route extends RoleBasedEntity` — neither it nor its base class declares any of the merge
 * layer's grafts — so `stripMetadata` drops the whole `_metadata` object (identity, audit, and
 * validity fields nest there; see the `core-resource-entity-metadata` capability) rather than
 * letting Core's `Route.class` deserializer reject the whole write.
 *
 * `description`/`createdAt`/`updatedAt` are stripped on top of it: `Route.class` declares none of
 * them, the generic `CreateEntity` form seeds every new asset with `{ name: '', description: '' }`
 * regardless of view (surviving onto the runtime object despite the type), and `ModifiedEntity`
 * types the timestamp pair. `Interceptor`/`Model` round-trip the audit pair fine because both
 * extend `Deployment`, which declares `author`/`createdAt`/`updatedAt` as real fields.
 */
function toRoutePayload(route: DialRouteResource) {
  const {
    description: __description,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    ...payload
  } = stripMetadata(route) as Omit<DialRouteResource, '_metadata'> & { description?: string };
  return payload;
}

export async function getRoutes(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.ROUTE, path);
}

export async function createRoute(route: DialRouteResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.ROUTE, route.name, toRoutePayload(route));
}

export async function getRoute(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialRouteResource>(token, ResourceType.ROUTE, path, etag);
}

export async function updateRoute(route: DialRouteResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.ROUTE, route.name, toRoutePayload(route), { etag });
}

export async function removeRoute(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.ROUTE, path, etag);
}

export async function bulkDeleteRoutes(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.ROUTE, paths);
}

/** `config-file-entity-views`: the route names Core's config file declares. */
export async function getConfigFileRoutes() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.Routes);
}

/** `config-file-entity-views`: reads a route by name from Core's config-file population directly. */
export async function getConfigFileRoute(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialRoute>(token, ConfigFileEntityType.Routes, name);
}
