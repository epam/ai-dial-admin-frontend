'use server';

import { cookies, headers } from 'next/headers';

import { filesCoreApi } from '@/src/app/api/api';
import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ConflictResolutionPolicy } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import {
  changeFolderCore,
  getFoldersCore,
  getRulesCore,
  removeFolderCore,
  updateRulesCore,
} from '@/src/server/folders/folders-core';

export async function getFolders(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const tree = await getFoldersCore(token, path);
  return (tree?.items as DialFolder[] | undefined) || [];
}

export async function getRules(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return getRulesCore(token, path);
}

export async function updateRules(targetFolder: string, rules: DialRule[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return updateRulesCore(token, targetFolder, rules);
}

export async function createFolderWithFiles(body: FormData, _type?: string, _view?: ApplicationRoute) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const config = JSON.parse(await (body.get('config') as Blob).text()) as {
    path: string;
    conflictResolutionStrategy: string;
  };
  const file = body.getAll('files')[0] as File;
  const overwrite = config.conflictResolutionStrategy === ConflictResolutionPolicy.OVERRIDE;
  return filesCoreApi.uploadFile(token, `${config.path}${file.name}`, file, { overwrite });
}

export async function removeFolder(path: string, resourceType: ResourceType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return removeFolderCore(token, path, [resourceType]);
}

export async function changeFolder(oldPath: string, newPath: string, resourceType: ResourceType, overwrite?: boolean) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return changeFolderCore(token, oldPath, newPath, [resourceType], overwrite);
}
