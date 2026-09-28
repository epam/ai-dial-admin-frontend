'use server';

import { cookies, headers } from 'next/headers';

import { assetApi } from '@/src/app/api/api';
import { DialRole } from '@/src/models/dial/role';
import { DialKeyResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { stripMetadata } from '@/src/server/assets/exim';
import { readConfigEntities } from '@/src/server/config-entities/read-page-options';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Core's `Key` is a plain POJO — it declares none of the merge layer's grafts — and Core's
 * `BLOB_MAPPER` runs with Jackson's default `FAIL_ON_UNKNOWN_PROPERTIES`, so any graft present on
 * the body rejects the whole write with a 400 "Failed to parse entity". `stripMetadata` drops the
 * whole `_metadata` object (identity, audit, and validity fields nest there; see the
 * `core-resource-entity-metadata` capability).
 *
 * `name`/`description`/`createdAt`/`updatedAt` are stripped on top of it: `Key.class` declares none
 * of them, the generic `CreateEntity`/`IdControl` form seeds `{ name, description }` regardless of
 * view (surviving onto the runtime object despite the type), and `ModifiedEntity` types the
 * timestamp pair — a stray value in either place would 400 the write the same way.
 *
 * `key` is included whenever the client holds a non-null value: create/rotation always do (the
 * secret is generated client-side), and a value typed into the JSON editor does. On a
 * properties-only save the field is absent — Core never returns the secret on reads, and its
 * `SecretFieldProcessor.mergePreservingOmittedSecrets` preserves the stored secret when it is
 * absent. A `null` from the JSON editor is deliberately normalized away the same way rather than
 * sent: Core's handling of an explicit null secret is unknown.
 */
function toKeyPayload(key: DialKeyResource) {
  const {
    name: __name,
    description: __description,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    key: keyValue,
    ...payload
  } = stripMetadata(key) as Omit<DialKeyResource, '_metadata'> & { description?: string };

  return {
    ...payload,
    ...(keyValue != null && { key: keyValue }),
  };
}

/**
 * The resource name a key write addresses: flat on a create/duplicate-flow entity (the form seeds
 * it), `_metadata`-nested on a fetched one (Core's `Key` declares no `name` field, so a merged read
 * carries its identity only in the merge graft).
 */
const keyResourceName = (key: DialKeyResource): string => key.name ?? key._metadata?.name ?? '';

export async function getKeys(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.PROJECT_KEY, path);
}

export async function createKey(key: DialKeyResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.PROJECT_KEY, keyResourceName(key), toKeyPayload(key));
}

export async function getKey(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialKeyResource>(token, ResourceType.PROJECT_KEY, path, etag);
}

export async function updateKey(key: DialKeyResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.PROJECT_KEY, keyResourceName(key), toKeyPayload(key), { etag });
}

export async function rotateKey(key: DialKeyResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.PROJECT_KEY, keyResourceName(key), toKeyPayload(key), { etag });
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
  return readConfigEntities<DialRole>(token, ConfigFileEntityType.Roles, [], false);
}
