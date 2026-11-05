'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, filesCoreApi } from '@/src/app/api/api';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ResourceType } from '@/src/types/resource-type';
import { changePath, extractVersionByPath } from '@/src/utils/files/path';
import { buildFilesExportZip } from '@/src/server/files/export';
import { toFileList } from '@/src/server/core/file-metadata';
import { fetchAllPages } from '@/src/server/core/pagination';

export async function getFiles(path: string): Promise<DialFile[]> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return fetchAllPages((nextToken) => filesCoreApi.getFileMetadata(token, path, false, nextToken), toFileList);
}

/**
 * Folders only: the folder trees of other resource types borrow them from Files, so file rows
 * (including the `.dial_folder` marker) are dropped here and never reach a client. A failed read
 * adds no folders instead of failing the caller's own listing.
 */
export async function getFileFolders(path: string): Promise<DialFile[]> {
  try {
    const files = await getFiles(path);
    return files.filter((file) => file.nodeType === DialFileNodeType.FOLDER);
  } catch {
    return [];
  }
}

export async function bulkDeleteFiles(items: { path: string; etag: string }[]): Promise<ServerActionResponse> {
  if (items.some((item) => !item.etag)) {
    return {
      success: false,
      errorHeader: 'Validation Error',
      errorMessage: 'Every file must have an etag to be deleted.',
    };
  }

  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  for (const { path, etag } of items) {
    const result = await filesCoreApi.deleteFile(token, path, etag);
    if (!result.success) {
      return result;
    }
  }
  return { success: true };
}

export async function removeFile(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return filesCoreApi.deleteFile(token, path, etag);
}

export async function moveFiles(paths: string[], newPath: string, overwrite?: boolean, duplicateName?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const requests = paths.map((path) => {
    let destinationPath = '';
    if (duplicateName) {
      const version = extractVersionByPath(path);
      const newName = version ? `${duplicateName}__${version}` : duplicateName;
      destinationPath = changePath(path, newPath, newName);
    } else {
      destinationPath = changePath(path, newPath);
    }
    return assetApi.move(token, ResourceType.FILE, path, destinationPath, overwrite);
  });
  return Promise.all(requests);
}

export async function exportFiles(paths: string[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return buildFilesExportZip(filesCoreApi, token, paths);
}
