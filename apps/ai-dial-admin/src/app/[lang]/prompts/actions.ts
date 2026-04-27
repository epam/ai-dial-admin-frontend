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
  return assetsApi.createAsset({ ...prompt, content: prompt.content || '' }, ResourceType.PROMPT, token);
}

export async function updatePrompt(prompt: DialPrompt, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.updateAssetWithEtag(token, prompt, ResourceType.PROMPT, etag);
}

export async function getPrompts(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const prompts = await assetsApi.getAssetList(token, path, ResourceType.PROMPT);

  return prompts;
}

export async function getPrompt(folderId: string, name: string, version: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const prompts = await assetsApi.getAssetList(token, `${folderId}/`, ResourceType.PROMPT);
  const path = prompts?.find((prompt) => prompt.name === name && (prompt as DialPrompt).version === version)
    ?.path as string;

  return assetsApi.getAssetWithEtag(token, path, ResourceType.PROMPT, etag);
}

export async function removePrompt(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.removeAssetWithEtag(token, path, ResourceType.PROMPT, etag);
}

export async function bulkDeletePrompts(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.bulkDeleteAssets(token, paths, ResourceType.PROMPT);
}

export async function movePrompts(paths: string[], newPath: string, overwrite?: boolean, duplicateName?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.moveAssets(token, paths, newPath, ResourceType.PROMPT, overwrite, duplicateName);
}

export async function exportPrompts(paths: string[], type?: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await assetsApi.exportAssets(token, ResourceType.PROMPT, paths, type);
}
