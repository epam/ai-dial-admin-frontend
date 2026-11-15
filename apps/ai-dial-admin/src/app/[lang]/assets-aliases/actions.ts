'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, configFileApi, coreUtilityApi } from '@/src/app/api/api';
import { ALIAS_NAME_PATTERN } from '@/src/constants/aliases';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AliasI18nKey } from '@/src/constants/i18n';
import { getI18n } from '@/src/locales/server';
import { DialAliasResource } from '@/src/models/dial/alias';
import { Translate } from '@/src/models/error';
import { findAliasHealthIssue } from '@/src/utils/aliases/health';
import { getAliasName, toAliasPayload } from '@/src/server/aliases/payload';
import { isDeploymentNameTaken } from '@/src/server/aliases/name-clash';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { isPlatformBucketPath, PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { validationFailure } from '@/src/utils/validation/server-action';

export async function getAliases(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.ALIAS, path);
}

/**
 * `folderId` is flat on a create-flow entity (the form seeds it) and `_metadata`-nested on a fetched one, as for
 * `createApp`. Public is the default, matching every other dual-bucket entity.
 */
export async function createAlias(alias: DialAliasResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const t = (await getI18n()) as Translate;
  const name = getAliasName(alias);
  const folderId = alias.folderId || alias._metadata?.folderId || `${ROOT_FOLDER}/`;
  const isPlatform = isPlatformBucketPath(folderId);

  if (!ALIAS_NAME_PATTERN.test(name)) {
    return validationFailure({ name: t(AliasI18nKey.NameInvalid) }, t);
  }

  // Only a Platform alias joins Core's flat deployment-id namespace; a Public one is called by its URL.
  if (isPlatform && (await isDeploymentNameTaken(assetApi, configFileApi, token, name))) {
    return validationFailure({ name: t(AliasI18nKey.NameTaken, { name }) }, t);
  }

  const bucket = isPlatform ? PLATFORM_ROOT_FOLDER : ROOT_FOLDER;
  return assetApi.put(token, ResourceType.ALIAS, `${bucket}/${name}`, toAliasPayload(alias));
}

export async function getAlias(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialAliasResource>(token, ResourceType.ALIAS, path, etag);
}

export async function updateAlias(alias: DialAliasResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const path = alias._metadata?.path ?? `${alias.folderId ?? `${ROOT_FOLDER}/`}${getAliasName(alias)}`;
  return assetApi.put(token, ResourceType.ALIAS, path, toAliasPayload(alias), { etag });
}

export async function removeAlias(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.ALIAS, path, etag);
}

export async function bulkDeleteAliases(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.ALIAS, paths);
}

export async function getConfigFileAliases() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.Aliases);
}

export async function getConfigFileAlias(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialAliasResource>(token, ConfigFileEntityType.Aliases, name);
}

/**
 * Core's health entry for one alias, if it lists one: a target that is missing or no longer fits, or a name taken
 * by another deployment. A failed read is no issue, so the banner never claims what Core did not say.
 */
export async function getAliasHealthIssue(name: string, isPublic: boolean) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const result = await coreUtilityApi.getConfigHealth(token);

  return result.success ? findAliasHealthIssue(result.response?.skipped, name, isPublic) : undefined;
}
