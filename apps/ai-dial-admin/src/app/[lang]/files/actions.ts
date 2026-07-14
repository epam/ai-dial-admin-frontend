'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, filesCoreApi } from '@/src/app/api/api';
import { ServerActionResponse } from '@/src/models/server-action';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ResourceType } from '@/src/types/resource-type';
import { changePath, extractVersionByPath } from '@/src/utils/files/path';
import { buildFilesExportZip } from '@/src/server/files/export';
import { toFileList } from '@/src/server/core/file-metadata';

export async function getFiles(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const metadata = await filesCoreApi.getFileMetadata(token, path, false);
  return toFileList(metadata);
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
