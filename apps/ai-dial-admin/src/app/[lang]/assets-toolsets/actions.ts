'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, assetsApi, toolsetOpsApi } from '@/src/app/api/api';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialToolsetResource } from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getToolsetBasicBody, getToolsetSignInBody } from '@/src/utils/toolset/toolset-auth';
import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { ImportFileType } from '@/src/types/import';
import { getVersionedName } from '@/src/server/publications/path';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { runAssetExportAction, runAssetImportAction } from '@/src/server/assets/import-export-action';
import { moveAssets } from '@/src/server/assets/move';
import { buildToolsetsExport, importToolsetsExport } from '@/src/server/toolsets/exim';
import { callToolViaMcp } from '@/src/server/toolsets/mcp-client';
import { buildToolsetsZip, extractToolsetsFromZip } from '@/src/server/toolsets/zip-exim';
import { getAllowTools, getTransport } from '@/src/components/Assets/Resources/utils';

export async function getToolsets(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.TOOLSET, path);
}

export async function createToolset(toolset: DialToolsetResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const folderId = toolset.folderId || ROOT_FOLDER;
  const path = `${folderId}${getVersionedName(toolset.name || '', toolset.version)}`;
  return assetApi.put(token, ResourceType.TOOLSET, path, {
    ...toolset,
    allowedTools: getAllowTools(toolset),
    transport: getTransport(toolset),
    displayVersion: toolset.version,
    folderId: undefined,
    version: undefined,
    path: undefined,
  });
}

export async function importToolsets(body: FormData, fileType: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runAssetImportAction(token, body, fileType, {
    assetApi,
    extractFromZip: extractToolsetsFromZip,
    importExport: importToolsetsExport,
  });
}

export async function getToolset(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialToolsetResource>(token, ResourceType.TOOLSET, path, etag);
}

export async function updateToolset(toolset: AssetToolset, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(
    token,
    ResourceType.TOOLSET,
    toolset.path,
    { ...toolset, displayVersion: toolset.version, folderId: undefined, version: undefined, path: undefined },
    { etag },
  );
}

export async function removeToolset(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.TOOLSET, path, etag);
}

export async function bulkDeleteToolsets(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.TOOLSET, paths);
}

export async function moveToolsets(paths: string[], newPath: string, overwrite?: boolean, duplicateName?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return moveAssets(assetApi, token, ResourceType.TOOLSET, paths, newPath, overwrite, duplicateName);
}

export async function getAssetTools(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolsetOpsApi.discoveredTools(token, name);
}

export async function signInToolset(
  toolset: AssetToolset,
  type: ToolsetAuthCredentialLevel,
  redirectUrl: string,
  apiKey?: string,
  authCode?: string,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolsetOpsApi.signIn(token, getToolsetSignInBody(toolset, type, apiKey, authCode, redirectUrl));
}

export async function signOutToolset(toolset: AssetToolset, type: ToolsetAuthCredentialLevel) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolsetOpsApi.signOut(token, getToolsetBasicBody(toolset, type));
}

export async function exportToolsets(paths: string[], type?: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runAssetExportAction(token, paths, type, {
    assetApi,
    buildExport: buildToolsetsExport,
    buildZip: buildToolsetsZip,
    zipFileName: 'toolsets-export.zip',
  });
}

export async function tryOutAssetTool(body: Record<string, unknown>, resourceType = ResourceType.TOOLSET) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  if (resourceType === ResourceType.TOOLSET) {
    const { toolSetPath, callToolRequest } = body as {
      toolSetPath: { path: string };
      callToolRequest: { name: string; arguments?: Record<string, unknown> };
    };
    return callToolViaMcp(process.env.DIAL_CORE_API_URL || '', token, toolSetPath.path, callToolRequest);
  }

  return assetsApi.tryOutTool(body, token, resourceType);
}
