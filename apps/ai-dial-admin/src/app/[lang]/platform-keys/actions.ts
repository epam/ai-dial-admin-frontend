'use server';

import { cookies, headers } from 'next/headers';

import { assetApi } from '@/src/app/api/api';
import { DialRole } from '@/src/models/dial/role';
import { DialKeyResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Core rejects `status`/`validationWarnings` on write — they are read-only projections — and never
 * round-trips `path`/`folderId` (derived from the resource name). `author`/`createdAt`/`updatedAt`
 * come from Core's metadata node, not from `Key.class` itself.
 *
 * `name`/`description`/`displayName` are stripped for the same reason `toRoutePayload`/`toRolePayload`
 * strip `description`: `Key.class` declares none of them, and Core's `BLOB_MAPPER` runs with Jackson's
 * default `FAIL_ON_UNKNOWN_PROPERTIES`, so any one of them present on the body rejects the whole write
 * with a 400 "Failed to parse entity". The generic `CreateEntity`/`IdControl` form seeds
 * `{ name, description }` regardless of view, and that field survives onto the runtime object
 * despite the type.
 *
 * The `key` field is NEVER included in regular updates — Core's `SecretFieldProcessor
 * .mergePreservingOmittedSecrets` preserves the existing secret when it is absent. Pass `key`
 * explicitly only on create and rotation.
 */
function toKeyPayload(key: DialKeyResource, options?: { includeKey?: boolean }) {
  const {
    status: __status,
    validationWarnings: __validationWarnings,
    path: __path,
    folderId: __folderId,
    author: __author,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    name: __name,
    description: __description,
    key: keyValue,
    ...payload
  } = key as DialKeyResource & { description?: string };

  return {
    ...payload,
    ...(options?.includeKey && keyValue !== undefined && { key: keyValue }),
  };
}

export async function getKeys(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.PROJECT_KEY, path);
}

export async function createKey(key: DialKeyResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.PROJECT_KEY, key.name, toKeyPayload(key, { includeKey: true }));
}

export async function getKey(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialKeyResource>(token, ResourceType.PROJECT_KEY, path, etag);
}

export async function updateKey(key: DialKeyResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.PROJECT_KEY, key.name, toKeyPayload(key), { etag });
}

export async function rotateKey(key: DialKeyResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.PROJECT_KEY, key.name, toKeyPayload(key, { includeKey: true }), { etag });
}

export async function removeKey(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.PROJECT_KEY, path, etag);
}

export async function bulkDeleteKeys(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.PROJECT_KEY, paths);
}

/**
 * The Core-direct key create modal runs client-side inside `BaseAssetList`, which has no roles
 * population of its own (unlike the detail page, which fetches server-side and threads them down).
 * This action mirrors that detail-page read so the modal's role-picker offers the same options
 * Core validates a reference against.
 */
export async function getKeyRolesOptions() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, []);
}
