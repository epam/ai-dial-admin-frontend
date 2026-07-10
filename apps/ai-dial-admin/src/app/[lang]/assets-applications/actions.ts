'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, assetsApi } from '@/src/app/api/api';
import { ROOT_FOLDER } from '@/src/constants/file';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { buildApplicationsExport, importApplicationsExport } from '@/src/server/applications/exim';
import { buildApplicationsZip, extractApplicationsFromZip } from '@/src/server/applications/zip-exim';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { runAssetExportAction, runAssetImportAction } from '@/src/server/assets/import-export-action';
import { moveAssets } from '@/src/server/assets/move';
import { validateApplicationResourceFields } from '@/src/server/core/asset-validation';
import { getVersionedName } from '@/src/server/publications/path';
import { ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

function validationFailure(errors: Record<string, string | undefined>): ServerActionResponse {
  return {
    success: false,
    errorHeader: 'Validation Error',
    errorMessage: Object.values(errors).filter(Boolean).join(', '),
  };
}

function validateApp(app: DialApplicationResource) {
  return validateApplicationResourceFields({
    viewerUrl: app.viewer_url,
    editorUrl: app.editor_url,
    maxInputAttachments: app.max_input_attachments != null ? Number(app.max_input_attachments) : undefined,
  }) as Record<string, string | undefined>;
}

export async function getApps(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.APPLICATION, path);
}

//todo Re-check createEntity modal, to not add unused fields
export async function createApp(app: DialApplicationResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const validationErrors = validateApp(app as DialApplicationResource);
  if (Object.keys(validationErrors).length > 0) {
    return validationFailure(validationErrors);
  }

  const folderId = app.folderId || ROOT_FOLDER;
  const path = `${folderId}${getVersionedName(app.name || '', app.version)}`;
  const asset = {
    ...app,
    displayVersion: app.version,
    folderId: undefined,
    source: undefined,
    version: undefined,
  };

  return assetApi.put(token, ResourceType.APPLICATION, path, asset);
}

export async function getApp(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<AssetApp>(token, ResourceType.APPLICATION, path, etag);
}

export async function importApps(body: FormData, fileType: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runAssetImportAction(token, body, fileType, {
    assetApi,
    extractFromZip: extractApplicationsFromZip,
    importExport: importApplicationsExport,
  });
}

export async function updateApp(app: DialApplicationResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const validationErrors = validateApp(app);
  if (Object.keys(validationErrors).length > 0) {
    return validationFailure(validationErrors);
  }

  const folderId = app.folderId || ROOT_FOLDER;
  const path = `${folderId}${getVersionedName(app.name || '', app.version)}`;
  const application = {
    ...app,
    defaults: { ...app.defaults },
    display_version: app.version,
    folderId: undefined,
    source: undefined,
    version: undefined,
    path: undefined,
  };
  return assetApi.put(token, ResourceType.APPLICATION, path, application, { etag });
}

export async function removeApp(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.APPLICATION, path, etag);
}

export async function bulkDeleteApps(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.APPLICATION, paths);
}

export async function moveApps(paths: string[], newPath: string, overwrite?: boolean, duplicateName?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return moveAssets(assetApi, token, ResourceType.APPLICATION, paths, newPath, overwrite, duplicateName);
}

export async function exportApps(paths: string[], type?: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return runAssetExportAction(token, paths, type, {
    assetApi,
    buildExport: buildApplicationsExport,
    buildZip: buildApplicationsZip,
    zipFileName: 'applications-export.zip',
  });
}

export async function getAssetTools(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getTools(name, token, ResourceType.APPLICATION);
}
