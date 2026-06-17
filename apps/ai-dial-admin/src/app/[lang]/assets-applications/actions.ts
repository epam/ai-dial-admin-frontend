'use server';

import { cookies, headers } from 'next/headers';

import { assetsApi } from '@/src/app/api/api';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ImportFileType } from '@/src/types/import';

export async function getApps(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getAssetList(token, path, ResourceType.APPLICATION);
}

export async function createApp(app: AssetApp) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const applicationProperties = app.applicationProperties ? { ...app.applicationProperties } : undefined;
  const asset = {
    ...app,
    ...(applicationProperties !== undefined && { applicationProperties }),
    displayVersion: app.version,
  };
  return assetsApi.createAsset(asset, ResourceType.APPLICATION, token);
}

export async function getApp(folderId: string, name: string, version: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const apps = await assetsApi.getAssetList(token, `${folderId}/`, ResourceType.APPLICATION);
  const path = apps?.find((app) => app.name === name && (app as AssetApp).version === version)?.path as string;

  return assetsApi.getAssetWithEtag(token, path, ResourceType.APPLICATION, etag);
}

export async function importApps(body: FormData, fileType: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.importAssets(token, body, fileType, ResourceType.APPLICATION);
}

export async function updateApp(app: AssetApp, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const application = {
    ...app,
    applicationProperties: { ...app.applicationProperties },
    defaults: { ...app.defaults },
    responsesDefaults: { ...app.responsesDefaults },
    displayVersion: app.version,
  };
  return assetsApi.updateAssetWithEtag(token, application, ResourceType.APPLICATION, etag);
}

export async function removeApp(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.removeAssetWithEtag(token, path, ResourceType.APPLICATION, etag);
}

export async function bulkDeleteApps(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.bulkDeleteAssets(token, paths, ResourceType.APPLICATION);
}

export async function moveApps(paths: string[], newPath: string, overwrite?: boolean, duplicateName?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.moveAssets(token, paths, newPath, ResourceType.APPLICATION, overwrite, duplicateName);
}

export async function exportApps(paths: string[], type?: ImportFileType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return await assetsApi.exportAssets(token, ResourceType.APPLICATION, paths, type);
}

export async function getAssetTools(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetsApi.getTools(name, token, ResourceType.APPLICATION);
}
