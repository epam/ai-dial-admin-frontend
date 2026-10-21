'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { stripMetadata } from '@/src/server/assets/exim';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Core's `Translator` is a plain POJO — it declares none of the merge layer's grafts — so
 * `stripMetadata` drops the whole `_metadata` object (identity, audit, and validity fields nest
 * there; see the `core-resource-entity-metadata` capability). `name`/`createdAt`/`updatedAt` are
 * stripped on top of it: `Translator` declares none of them either, the create form seeds `name`,
 * and `ModifiedEntity` types the timestamp pair.
 */
function toTranslatorPayload(translator: DialTranslatorResource) {
  const { name: __name, createdAt: __createdAt, updatedAt: __updatedAt, ...payload } = stripMetadata(translator);
  return payload;
}

/**
 * The resource name a translator write addresses: flat on a create-flow entity (the form seeds it),
 * `_metadata`-nested on a fetched one (Core's `Translator` declares no `name` field, so a merged
 * read carries its identity only in the merge graft).
 */
const translatorResourceName = (translator: DialTranslatorResource): string =>
  translator.name ?? translator._metadata?.name ?? '';

export async function getTranslators(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.TRANSLATOR, path);
}

export async function createTranslator(translator: DialTranslatorResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(
    token,
    ResourceType.TRANSLATOR,
    translatorResourceName(translator),
    toTranslatorPayload(translator),
  );
}

export async function getTranslator(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialTranslatorResource>(token, ResourceType.TRANSLATOR, path, etag);
}

export async function getConfigFileTranslators() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.Translators);
}

export async function getConfigFileTranslator(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialTranslatorResource>(token, ConfigFileEntityType.Translators, name);
}

export async function updateTranslator(translator: DialTranslatorResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(
    token,
    ResourceType.TRANSLATOR,
    translatorResourceName(translator),
    toTranslatorPayload(translator),
    { etag },
  );
}

export async function removeTranslator(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.TRANSLATOR, path, etag);
}

export async function bulkDeleteTranslators(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.TRANSLATOR, paths);
}
