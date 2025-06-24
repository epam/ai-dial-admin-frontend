'use server';

import { cookies, headers } from 'next/headers';

import { filesApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ImportFileType } from '@/src/types/import';

export async function getFiles(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return filesApi.getFilesList(token, path);
}

export async function removeFile(path?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return filesApi.removeFile(token, path);
}

export async function moveFiles(paths: string[], newPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return filesApi.moveFiles(token, paths, newPath);
}

export async function importFiles(body: FormData, fileType: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return filesApi.importFiles(token, body, fileType);
}

export async function exportFiles(paths: string[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await filesApi.exportFiles(token, paths);
}
