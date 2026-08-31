'use server';

import { cookies, headers } from 'next/headers';

import { assetApi } from '@/src/app/api/api';
import { DialRouteResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Core rejects `status`/`validationWarnings` on write — they are read-only projections it adds on a
 * rejected read (see `DialModelResourceStatus`/`CoreValidationWarning`) — and never round-trips
 * `path`/`folderId`, which are derived from the resource name rather than stored.
 *
 * `author`/`createdAt`/`updatedAt` are also stripped, even though `DialRouteResource` declares them
 * (via `ModifiedEntity`, for `ResourceInfoHeader` to display): they come from Core's *metadata* node
 * (`mergeRouteResource`'s `flatMetadataFields`), not from `Route.class` itself. `Interceptor`/`Model`
 * round-trip these fine because both extend `Deployment`, which declares `author`/`createdAt`/
 * `updatedAt` as real fields. `Route extends RoleBasedEntity` directly — neither it nor its base class
 * has them — so Core's `Route.class` deserializer rejects the whole write once any of the three is
 * present.
 *
 * `description` is stripped for the same reason, one property earlier: the generic `CreateEntity`
 * form seeds every new asset with `{ name: '', description: '' }` regardless of view, and that field
 * survives onto this runtime object despite the type.
 */
function toRoutePayload(route: DialRouteResource) {
  const {
    status: __status,
    validationWarnings: __validationWarnings,
    path: __path,
    folderId: __folderId,
    author: __author,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    description: __description,
    ...payload
  } = route as DialRouteResource & { description?: string };
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
