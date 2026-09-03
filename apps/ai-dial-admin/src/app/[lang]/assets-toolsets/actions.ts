'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, toolsetOpsApi } from '@/src/app/api/api';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import {
  DialPlatformToolsetResource,
  DialToolsetResource,
  ToolsetAuthCredentialLevel,
} from '@/src/models/dial/resource';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { getToolsetBasicBody, getToolsetSignInBody } from '@/src/utils/toolset/toolset-auth';
import { ImportFileType } from '@/src/types/import';
import { getVersionedName } from '@/src/server/publications/path';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { runAssetExportAction, runAssetImportAction } from '@/src/server/assets/import-export-action';
import { moveAssets } from '@/src/server/assets/move';
import { buildToolsetsExport, importToolsetsExport } from '@/src/server/toolsets/exim';
import { buildApplicationMcpUrl, buildToolsetMcpUrl, callToolViaMcp } from '@/src/server/toolsets/mcp-client';
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

/**
 * Platform-bucket toolsets ("World B") reuse the same Core `ToolSet` entity as public-bucket ones —
 * only the bucket segment of the path differs, and the bucket is flat (no folders, no versioning; see
 * the `platform-toolsets` capability spec). `getToolsets`/`removeToolset`/`bulkDeleteToolsets` already
 * take an arbitrary path and need no platform-specific logic; `createToolset`/`updateToolset` compute
 * a `public`-defaulted, version-suffixed path, so their platform counterparts pin `folderId` to the
 * `platform` bucket and clear `version`, letting `getVersionedName`'s existing no-op-when-absent
 * branch (see `createToolset`/`updateToolset`) produce the flat `platform/{name}` path without a new
 * branch there.
 */
export async function getPlatformToolsets(path: string) {
  return getToolsets(path);
}

/**
 * Unlike the generic `ResourceController` public-bucket writes go through, `ConfigResourceController`
 * (the platform bucket's write path) deserializes the request body straight into `ToolSet` via
 * Jackson with the default `FAIL_ON_UNKNOWN_PROPERTIES` — the same reason `platform-keys/actions.ts`'s
 * `toKeyPayload` strips extras for `Key.class`. `status`/`validationWarnings` are read-only
 * projections Core computes, not part of the entity; `author`/`createdAt`/`updatedAt` come from the
 * metadata node, not `ToolSet` itself; `reference` is a client-only tracking id (see `handleDuplicate`/
 * `addNewVersion`, which already strip it before any write). None of these round-trip through the
 * merge readers as content fields, so they must not be sent back on write.
 */
function toPlatformToolsetPayload(toolset: DialPlatformToolsetResource) {
  const {
    status: __status,
    validationWarnings: __validationWarnings,
    author: __author,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    reference: __reference,
    ...payload
  } = toolset as DialPlatformToolsetResource & { reference?: string };

  return payload;
}

export async function createPlatformToolset(toolset: DialPlatformToolsetResource) {
  return createToolset({
    ...toPlatformToolsetPayload(toolset),
    folderId: `${PLATFORM_ROOT_FOLDER}/`,
    version: undefined,
  } as unknown as DialToolsetResource);
}

export async function getPlatformToolset(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialPlatformToolsetResource>(token, ResourceType.TOOLSET, path, etag);
}

export async function updatePlatformToolset(toolset: DialPlatformToolsetResource, etag: string) {
  return updateToolset(
    {
      ...toPlatformToolsetPayload(toolset),
      folderId: `${PLATFORM_ROOT_FOLDER}/`,
      version: undefined,
    } as unknown as AssetToolset,
    etag,
  );
}

export async function removePlatformToolset(path: string, etag?: string) {
  return removeToolset(path, etag);
}

export async function bulkDeletePlatformToolsets(paths: { path: string }[]) {
  return bulkDeleteToolsets(paths);
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

  const { toolSetPath, callToolRequest } = body as {
    toolSetPath: { path: string };
    callToolRequest: { name: string; arguments?: Record<string, unknown> };
  };
  const buildMcpUrl = resourceType === ResourceType.TOOLSET ? buildToolsetMcpUrl : buildApplicationMcpUrl;
  const url = buildMcpUrl(process.env.DIAL_CORE_API_URL || '', toolSetPath.path);
  return callToolViaMcp(url, token, callToolRequest);
}
