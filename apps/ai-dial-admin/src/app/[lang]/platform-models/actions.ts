'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DialModel } from '@/src/models/dial/model';
import { DialModelResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { stripMetadata } from '@/src/server/assets/exim';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { stripEmptyUpstreamSecrets } from '@/src/utils/models/upstream-secrets';

function toModelPayload(model: DialModelResource) {
  // `name`/`author`/`createdAt`/`updatedAt` are deliberately kept: Core's `Model` carries them via
  // `RoleBasedEntity`/`Deployment`, so they are real content fields rather than injected ones, and
  // the existing action tests pin them. Everything the merge layer grafts (identity, audit, and the
  // `status`/`validationWarnings` validity projections) nests under `_metadata`, which `stripMetadata`
  // drops wholesale (see the `core-resource-entity-metadata` capability).
  const payload = stripMetadata(model);

  return { ...payload, ...(payload.upstreams && { upstreams: stripEmptyUpstreamSecrets(payload.upstreams) }) };
}

export async function getModels(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.MODEL, path);
}

export async function createModel(model: DialModelResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.MODEL, model.name, toModelPayload(model));
}

export async function getModel(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<AssetModel>(token, ResourceType.MODEL, path, etag);
}

export async function updateModel(model: DialModelResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.MODEL, model.name, toModelPayload(model), { etag });
}

export async function removeModel(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.MODEL, path, etag);
}

export async function bulkDeleteModels(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.MODEL, paths);
}

/** `config-file-entity-views`: the model names Core's config file declares, for the toggled-on list. */
export async function getConfigFileModels() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.Models);
}

/** `config-file-entity-views`: reads a model by name from Core's config-file population directly. */
export async function getConfigFileModel(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialModel>(token, ConfigFileEntityType.Models, name);
}
