'use server';

import { cookies, headers } from 'next/headers';

import { assetApi } from '@/src/app/api/api';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Core rejects `status`/`validationWarnings` on write — they are read-only projections it adds on a
 * rejected read (see `DialModelResourceStatus`/`CoreValidationWarning`) — and never round-trips
 * `path`/`folderId`, which are derived from the resource name rather than stored.
 */
function toTranslatorPayload(translator: DialTranslatorResource) {
  const {
    status: __status,
    validationWarnings: __validationWarnings,
    path: __path,
    folderId: __folderId,
    name: __name,
    author: __author,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    ...payload
  } = translator;
  return payload;
}

export async function getTranslators(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.TRANSLATOR, path);
}

export async function createTranslator(translator: DialTranslatorResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.TRANSLATOR, translator.name, toTranslatorPayload(translator));
}

export async function getTranslator(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialTranslatorResource>(token, ResourceType.TRANSLATOR, path, etag);
}

export async function updateTranslator(translator: DialTranslatorResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.TRANSLATOR, translator.name, toTranslatorPayload(translator), { etag });
}

export async function removeTranslator(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.TRANSLATOR, path, etag);
}

export async function bulkDeleteTranslators(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.TRANSLATOR, paths);
}
