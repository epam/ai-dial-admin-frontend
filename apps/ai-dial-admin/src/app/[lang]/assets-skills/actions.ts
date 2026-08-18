'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, skillsCoreApi } from '@/src/app/api/api';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { toSkillList } from '@/src/server/core/skill-metadata';
import { moveAssets } from '@/src/server/assets/move';
import { DialSkillResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Lists the direct children of a Skill folder — metadata-only rows, no per-child content or
 * skill-metadata fetch (design D1). Paginates via `listSkillMetadata`'s continuation token until
 * the full folder has been read.
 */
export async function getSkills(path: string): Promise<ResourceInfo[]> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const items: ResourceInfo[] = [];
  let nextToken: string | undefined;
  do {
    const node = await skillsCoreApi.listSkillMetadata(token, path, { nextToken });
    items.push(...toSkillList(node));
    nextToken = node?.nextToken;
  } while (nextToken);
  return items;
}

/**
 * Reads a single skill's metadata (name/description/version/etag/files) for the detail page.
 * Returns the shared `ServerActionResponse` shape (rather than the resource directly) so this slots
 * into `GetAssetActionMap` alongside every other asset type's getter; the unused `_etag` parameter
 * exists for the same reason — skill reads aren't conditional, but the shared call site always
 * passes one.
 */
export async function getSkill(path: string, _etag?: string): Promise<ServerActionResponse<DialSkillResource>> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const response = await skillsCoreApi.getSkillMetadata(token, path);
  if (!response) {
    return { success: false, errorHeader: 'Not Found', errorMessage: 'Skill resource not found' };
  }
  return { success: true, response, etag: response.etag };
}

export async function removeSkill(path: string, etag: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return skillsCoreApi.deleteSkill(token, path, etag);
}

/**
 * Uploads (creates or replaces) a single file within a skill's bundle. Takes the file wrapped in
 * `FormData` — a bare `File` argument isn't how server actions in this app pass file content (see
 * `importToolsets`/`importFiles`) — rather than the file object directly.
 */
export async function uploadSkillFile(
  path: string,
  filePath: string,
  formData: FormData,
): Promise<ServerActionResponse> {
  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, errorHeader: 'Validation Error', errorMessage: 'No file provided' };
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return skillsCoreApi.uploadSkillFile(token, path, filePath, file);
}

export async function removeSkillFile(path: string, filePath: string, etag?: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return skillsCoreApi.deleteSkillFile(token, path, filePath, etag);
}

/**
 * Moves a skill to a different folder. Uses the generic `AssetApi.move` (`POST
 * /v1/ops/resource/move`) directly — Core's move op is resource-type-agnostic and already accepts
 * `SKILL` via `RESOURCE_TYPE_PREFIX[ResourceType.SKILL]`, so no new Core client code is needed, only
 * this thin action wrapper (matching `moveToolsets`/`movePrompts`'s shape).
 */
export async function moveSkills(paths: string[], newPath: string, overwrite?: boolean) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return moveAssets(assetApi, token, ResourceType.SKILL, paths, newPath, overwrite);
}

export async function bulkDeleteSkills(items: { path: string; etag?: string }[]): Promise<ServerActionResponse> {
  if (items.some((item) => !item.etag)) {
    return {
      success: false,
      errorHeader: 'Validation Error',
      errorMessage: 'Every skill must have an etag to be deleted.',
    };
  }

  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  for (const { path, etag } of items) {
    const result = await skillsCoreApi.deleteSkill(token, path, etag as string);
    if (!result.success) {
      return result;
    }
  }
  return { success: true };
}
