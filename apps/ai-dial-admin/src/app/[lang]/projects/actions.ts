'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, projectsCoreApi } from '@/src/app/api/api';
import { DialProjectResource } from '@/src/models/dial/resource';
import { ProjectContextLimits } from '@/src/models/project-context';
import { ServerActionResponse } from '@/src/models/server-action';
import { moveAssets } from '@/src/server/assets/move';
import { fetchAllPages } from '@/src/server/core/pagination';
import { toProjectList } from '@/src/server/core/project-metadata';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getProjectContextLimits } from '@/src/utils/env/get-project-context-limits';
import { addTrailingSlash } from '@/src/utils/url';

/**
 * Lists the direct children of a Project folder — metadata-only rows, no per-child content or manifest fetch.
 * Paginates via `listProjectMetadata`'s continuation token until the full folder has been read.
 */
export async function getProjects(path: string): Promise<ResourceInfo[]> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return fetchAllPages((nextToken) => projectsCoreApi.listProjectMetadata(token, path, { nextToken }), toProjectList);
}

/**
 * Reads a single project's metadata (path/etag/files) for the detail page. Returns the shared
 * `ServerActionResponse` shape so this slots into `GetAssetActionMap` alongside every other asset type's
 * getter; the unused `_etag` parameter exists for the same reason.
 */
export async function getProject(path: string, _etag?: string): Promise<ServerActionResponse<DialProjectResource>> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const response = await projectsCoreApi.getProjectMetadata(token, path);
  if (!response) {
    return { success: false, errorHeader: 'Not Found', errorMessage: 'Project resource not found' };
  }
  return { success: true, response, etag: response.etag };
}

export async function removeProject(path: string, etag: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return projectsCoreApi.deleteProject(token, path, etag);
}

/**
 * Creates a brand-new, manifest-only project at `${folderId}${name}`. `folderId` isn't guaranteed to already
 * end with a slash, so `addTrailingSlash` normalizes it here rather than trusting the caller.
 */
export async function createProject(
  name: string,
  description: string,
  folderId: string,
): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const path = `${addTrailingSlash(folderId)}${name}`;
  return projectsCoreApi.createProject(token, path, name, description);
}

/** Creates an empty Projects grouping folder at the given path. */
export async function createProjectFolder(folderPath: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return projectsCoreApi.createProjectFolder(token, folderPath);
}

/**
 * Uploads (creates or replaces) a single file within a project's bundle. Takes the file wrapped in `FormData`
 * — a bare `File` argument isn't how server actions in this app pass file content.
 */
export async function uploadProjectFile(
  path: string,
  filePath: string,
  formData: FormData,
): Promise<ServerActionResponse> {
  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, errorHeader: 'Validation Error', errorMessage: 'No file provided' };
  }
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return projectsCoreApi.uploadProjectFile(token, path, filePath, file);
}

export async function removeProjectFile(path: string, filePath: string, etag?: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return projectsCoreApi.deleteProjectFile(token, path, filePath, etag);
}

/**
 * Reads `PROJECT.md`'s raw content for the Description and Instructions fields (see `parseProjectManifest`).
 * Shared by `Assets > Projects` and Project Publications — the underlying Core route is keyed only by path.
 */
export async function getProjectManifest(path: string): Promise<ServerActionResponse> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return projectsCoreApi.getProjectManifestContent(token, path);
}

/**
 * Moves a project to a different folder through the generic `AssetApi.move` (`POST /v1/ops/resource/move`),
 * which is resource-type-agnostic and already accepts `PROJECT`.
 */
export async function moveProjects(paths: string[], newPath: string, overwrite?: boolean) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return moveAssets(assetApi, token, ResourceType.PROJECT, paths, newPath, overwrite);
}

export async function bulkDeleteProjects(items: { path: string; etag?: string }[]): Promise<ServerActionResponse> {
  if (items.some((item) => !item.etag)) {
    return {
      success: false,
      errorHeader: 'Validation Error',
      errorMessage: 'Every project must have an etag to be deleted.',
    };
  }

  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  for (const { path, etag } of items) {
    const result = await projectsCoreApi.deleteProject(token, path, etag as string);
    if (!result.success) {
      return result;
    }
  }
  return { success: true };
}

/** The deployment's context-file limits (`PROJECT_CONTEXT_*`), read server-side and handed to the client views. */
export async function getContextLimits(): Promise<ProjectContextLimits> {
  return getProjectContextLimits();
}
