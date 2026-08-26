'use server';

import { cookies, headers } from 'next/headers';

import { assetApi } from '@/src/app/api/api';
import { DialRoleResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { toWireRoleLimits } from '@/src/utils/roles/limits';

/**
 * Core rejects `status`/`validationWarnings` on write — they are read-only projections it adds on a
 * rejected read — and never round-trips `path`/`folderId`, which are derived from the resource name
 * rather than stored. `author`/`createdAt`/`updatedAt` come from Core's *metadata* node
 * (`mergeRoleResource`'s `flatMetadataFields`), not from `Role.class` itself, and `description` is
 * stripped for the same reason the generic `CreateEntity` form seeds every new asset with
 * `{ name: '', description: '' }` regardless of view. `Role` is a plain class — like `Route extends
 * RoleBasedEntity`, it declares none of these — so Core's `Role.class` deserializer rejects the whole
 * write once any of them is present (see `assets-routes/actions.ts`'s `toRoutePayload`, which found
 * this the hard way; stripped here up front instead).
 *
 * `costLimit`/`limits` go through `toWireRoleLimits` — `mergeRoleResource` already dropped any
 * token that overflowed a safe integer (the `Long.MAX_VALUE` "unlimited" sentinel included; see its
 * doc comment) rather than keeping a lossily-rounded number, so every remaining token here is a
 * plain, safe-range value, and omitting a token on write is exactly equivalent to the sentinel —
 * Core defaults a missing `costLimit`/`limits` token to `Long.MAX_VALUE` itself.
 */
function toRolePayload(role: DialRoleResource) {
  const {
    status: __status,
    validationWarnings: __validationWarnings,
    path: __path,
    folderId: __folderId,
    author: __author,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    description: __description,
    costLimit,
    limits,
    ...payload
  } = role as DialRoleResource & { description?: string };
  return {
    ...payload,
    ...(costLimit !== undefined && { costLimit: toWireRoleLimits(costLimit) }),
    ...(limits !== undefined && {
      limits: Object.fromEntries(
        Object.entries(limits || {}).map(([name, roleLimits]) => [name, toWireRoleLimits(roleLimits)]),
      ),
    }),
  };
}

export async function getRoles(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.ROLE, path);
}

export async function createRole(role: DialRoleResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.ROLE, role.name, toRolePayload(role));
}

export async function getRole(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialRoleResource>(token, ResourceType.ROLE, path, etag);
}

export async function updateRole(role: DialRoleResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.ROLE, role.name, toRolePayload(role), { etag });
}

export async function removeRole(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.ROLE, path, etag);
}

export async function bulkDeleteRoles(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.ROLE, paths);
}
