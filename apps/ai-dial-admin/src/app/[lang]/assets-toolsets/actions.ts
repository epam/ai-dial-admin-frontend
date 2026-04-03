'use server';

import { cookies, headers } from 'next/headers';

import { assetsApi } from '@/src/app/api/api';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getAllowTools, getTransport } from '@/src/utils/toolset/toolset-transport';
import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { ImportFileType } from '@/src/types/import';

export async function getToolsets(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getAssetList(token, path, ResourceType.TOOLSET);
}

export async function createToolset(toolset: AssetToolset) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.createAsset(
    {
      ...toolset,
      allowedTools: getAllowTools(toolset),
      transport: getTransport(toolset),
      displayVersion: toolset.version,
    },
    ResourceType.TOOLSET,
    token,
  );
}

export async function importToolsets(body: FormData, fileType: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.importAssets(token, body, fileType, ResourceType.TOOLSET);
}

export async function getToolset(folderId: string, name: string, version: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const toolsets = await assetsApi.getAssetList(token, `${folderId}/`, ResourceType.TOOLSET);
  const path = toolsets?.find((toolset) => toolset.name === name && (toolset as AssetToolset).version === version)
    ?.path as string;

  return assetsApi.getAssetWithEtag(token, path, ResourceType.TOOLSET, etag);
}

export async function updateToolset(toolset: AssetToolset, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.updateAssetWithEtag(
    token,
    { ...toolset, displayVersion: toolset.version },
    ResourceType.TOOLSET,
    etag,
  );
}

export async function removeToolset(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.removeAssetWithEtag(token, path, ResourceType.TOOLSET, etag);
}

export async function bulkDeleteToolsets(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.bulkDeleteAssets(token, paths, ResourceType.TOOLSET);
}

export async function moveToolsets(paths: string[], newPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.moveAssets(token, paths, newPath, ResourceType.TOOLSET);
}

export async function getAssetTools(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getTools(name, token);
}

export async function signInToolset(
  toolset: AssetToolset,
  type: ToolsetAuthCredentialLevel,
  redirectUrl: string,
  apiKey?: string,
  authCode?: string,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.signInToolset(toolset, type, token, redirectUrl, apiKey, authCode);
}

export async function signOutToolset(toolset: AssetToolset, type: ToolsetAuthCredentialLevel) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.signOutToolset(toolset, type, token);
}

export async function exportToolsets(paths: string[], type?: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await assetsApi.exportAssets(token, ResourceType.TOOLSET, paths, type);
}

export async function tryOutAssetTool(body: Record<string, unknown>, resourceType = ResourceType.TOOLSET) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.tryOutTool(body, token, resourceType);
}
