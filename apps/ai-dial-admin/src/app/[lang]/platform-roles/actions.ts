'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { stripMetadata } from '@/src/server/assets/exim';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { toWireRoleLimits } from '@/src/utils/roles/limits';

/**
 * Core's `Role` is a plain class — like `Route extends RoleBasedEntity`, it declares none of the
 * merge layer's grafts — so `stripMetadata` drops the whole `_metadata` object (identity, audit,
 * and validity fields nest there; see the `core-resource-entity-metadata` capability) rather than
 * letting Core's `Role.class` deserializer reject the whole write.
 *
 * `description`/`createdAt`/`updatedAt` are stripped on top of it: `Role.class` declares none of
 * them, the generic `CreateEntity` form seeds every new asset with `{ name: '', description: '' }`
 * regardless of view (surviving onto the runtime object despite the type — see
 * `assets-routes/actions.ts`'s `toRoutePayload`, which found this the hard way), and `ModifiedEntity`
 * types the timestamp pair.
 *
 * `costLimit`/`limits` go through `toWireRoleLimits` — `mergeRoleResource` already dropped any
 * token that overflowed a safe integer (the `Long.MAX_VALUE` "unlimited" sentinel included; see its
 * doc comment) rather than keeping a lossily-rounded number, so every remaining token here is a
 * plain, safe-range value, and omitting a token on write is exactly equivalent to the sentinel —
 * Core defaults a missing `costLimit`/`limits` token to `Long.MAX_VALUE` itself.
 */
function toRolePayload(role: DialRoleResource) {
  const {
    description: __description,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    costLimit,
    limits,
    ...payload
  } = stripMetadata(role) as Omit<DialRoleResource, '_metadata'> & { description?: string };
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

/** `config-file-entity-views`: the role names Core's config file declares. */
export async function getConfigFileRoles() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.Roles);
}

/** `config-file-entity-views`: reads a role by name from Core's config-file population directly. */
export async function getConfigFileRole(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialRole>(token, ConfigFileEntityType.Roles, name);
}
