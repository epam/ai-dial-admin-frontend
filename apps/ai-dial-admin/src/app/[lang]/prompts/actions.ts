'use server';

import { cookies, headers } from 'next/headers';

import { assetApi } from '@/src/app/api/api';
import { DialPrompt } from '@/src/models/dial/prompt';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { getVersionedName } from '@/src/server/publications/path';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { runAssetExportAction, runAssetImportAction } from '@/src/server/assets/import-export-action';
import { moveAssets } from '@/src/server/assets/move';
import { buildPromptsExport, importPromptsExport } from '@/src/server/prompts/exim';
import { buildPromptsZip, extractPromptsFromZip } from '@/src/server/prompts/zip-exim';

export async function createPrompt(prompt: DialPrompt) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const path = `${prompt.folderId}${getVersionedName(prompt.name || '', prompt.version)}`;
  return assetApi.put(token, ResourceType.PROMPT, path, { ...prompt, content: prompt.content || '' });
}

export async function updatePrompt(prompt: DialPrompt, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.PROMPT, prompt.path, prompt, { etag });
}

export async function getPrompts(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.PROMPT, path);
}

export async function getPrompt(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialPrompt>(token, ResourceType.PROMPT, path, etag);
}

export async function removePrompt(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.PROMPT, path, etag);
}

export async function bulkDeletePrompts(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.PROMPT, paths);
}

export async function movePrompts(paths: string[], newPath: string, overwrite?: boolean, duplicateName?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return moveAssets(assetApi, token, ResourceType.PROMPT, paths, newPath, overwrite, duplicateName);
}

export async function exportPrompts(paths: string[], type?: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runAssetExportAction(token, paths, type, {
    assetApi,
    buildExport: buildPromptsExport,
    buildZip: buildPromptsZip,
    zipFileName: 'prompts-export.zip',
  });
}

export async function importPrompts(body: FormData, fileType: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runAssetImportAction(token, body, fileType, {
    assetApi,
    extractFromZip: extractPromptsFromZip,
    importExport: importPromptsExport,
  });
}
