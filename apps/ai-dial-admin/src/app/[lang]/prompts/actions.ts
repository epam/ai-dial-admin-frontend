'use server';

import { cookies, headers } from 'next/headers';

import { assetsApi } from '@/src/app/api/api';
import { DialPrompt } from '@/src/models/dial/prompt';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';

export async function createPrompt(prompt: DialPrompt) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.createPrompt(prompt, token);
}

export async function getPrompts(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const prompts = await assetsApi.getAssetList(token, path, ResourceType.PROMPT);

  return prompts;
}

export async function getPrompt(folderId: string, name: string, version: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const prompts = await assetsApi.getAssetList(token, `${folderId}/`, ResourceType.PROMPT);
  const path = prompts?.find((prompt) => prompt.name === name && (prompt as DialPrompt).version === version)
    ?.path as string;

  return assetsApi.getAsset(token, path, ResourceType.PROMPT);
}

export async function removePrompt(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.removeAsset(token, path, ResourceType.PROMPT);
}

export async function bulkDeletePrompts(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.bulkDeleteAssets(token, paths, ResourceType.PROMPT);
}

export async function movePrompts(paths: string[], newPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.moveAssets(token, paths, newPath, ResourceType.PROMPT);
}

export async function importPrompts(body: FormData, fileType: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.importAssets(token, body, fileType, ResourceType.PROMPT);
}

export async function exportPrompts(paths: string[], type?: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await assetsApi.exportPrompts(token, paths, type);
}
