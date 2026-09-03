'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, externalServiceConsentApi, externalServiceOpsApi, toolsetOpsApi } from '@/src/app/api/api';
import { ROOT_FOLDER } from '@/src/constants/file';
import {
  DialApplicationResource,
  DialExternalServiceAuthSettings,
  DialPlatformApplicationResource,
  ToolsetAuthType,
} from '@/src/models/dial/resource';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { buildApplicationsExport, importApplicationsExport } from '@/src/server/applications/exim';
import { buildApplicationsZip, extractApplicationsFromZip } from '@/src/server/applications/zip-exim';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { runAssetExportAction, runAssetImportAction } from '@/src/server/assets/import-export-action';
import { moveAssets } from '@/src/server/assets/move';
import { validateApplicationResourceFields } from '@/src/server/core/asset-validation';
import { encodeCorePath, getVersionedName } from '@/src/server/publications/path';
import { ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { DialApplication } from '@/src/models/dial/application';

function validationFailure(errors: Record<string, string | undefined>): ServerActionResponse {
  return {
    success: false,
    errorHeader: 'Validation Error',
    errorMessage: Object.values(errors).filter(Boolean).join(', '),
  };
}

function stripExternalServiceAuthStatuses(app: DialApplicationResource): DialApplicationResource {
  if (!app.external_services) return app;
  const external_services = Object.fromEntries(
    Object.entries(app.external_services).map(([id, service]) => {
      if (!service.auth_settings) return [id, service];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { app_level_auth_status, user_level_auth_status, global_auth_status, ...cleanSettings } =
        service.auth_settings as DialExternalServiceAuthSettings;
      return [id, { ...service, auth_settings: cleanSettings }];
    }),
  );
  return { ...app, external_services };
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
    path: undefined,
    application_type_schema_id:
      app.application_type_schema_id || (app as DialApplication)?.source?.applicationTypeSchemaId,
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
  const cleaned = stripExternalServiceAuthStatuses(app);
  const application = {
    ...cleaned,
    defaults: { ...cleaned.defaults },
    display_version: cleaned.version,
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

/**
 * Platform-bucket applications ("World B") reuse the same Core `Application` entity as public-bucket
 * ones — only the bucket segment of the path differs, and the bucket is flat (no folders, no
 * versioning; see the `platform-applications` capability spec). `getApps`/`removeApp`/`bulkDeleteApps`
 * already take an arbitrary path and need no platform-specific logic; `createApp`/`updateApp` compute
 * a `public`-defaulted, version-suffixed path, so their platform counterparts pin `folderId` to the
 * `platform` bucket and clear `version`, letting `getVersionedName`'s existing no-op-when-absent branch
 * (see `createApp`/`updateApp`) produce the flat `platform/{name}` path without a new branch there.
 */
export async function getPlatformApplications(path: string) {
  return getApps(path);
}

/**
 * Unlike the generic `ResourceController` public-bucket writes go through, `ConfigResourceController`
 * (the platform bucket's write path) deserializes the request body straight into `Application` via
 * Jackson with the default `FAIL_ON_UNKNOWN_PROPERTIES` — the same reason `platform-keys/actions.ts`'s
 * `toKeyPayload` strips extras for `Key.class`. `status`/`validationWarnings` are read-only
 * projections Core computes, not part of the entity; `author`/`createdAt`/`updatedAt` come from the
 * metadata node, not `Application` itself; `reference` is a client-only tracking id (see
 * `handleDuplicate`/`addNewVersion`, which already strip it before any write). None of these round-trip
 * through the merge readers as content fields, so they must not be sent back on write.
 */
function toPlatformApplicationPayload(app: DialPlatformApplicationResource) {
  const {
    status: __status,
    validationWarnings: __validationWarnings,
    author: __author,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    reference: __reference,
    ...payload
  } = app as DialPlatformApplicationResource & { reference?: string };

  return payload;
}

export async function createPlatformApplication(app: DialPlatformApplicationResource) {
  return createApp({
    ...toPlatformApplicationPayload(app),
    folderId: `${PLATFORM_ROOT_FOLDER}/`,
    version: undefined,
  } as unknown as DialApplicationResource);
}

export async function getPlatformApplication(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialPlatformApplicationResource>(token, ResourceType.APPLICATION, path, etag);
}

export async function updatePlatformApplication(app: DialPlatformApplicationResource, etag: string) {
  return updateApp(
    {
      ...toPlatformApplicationPayload(app),
      folderId: `${PLATFORM_ROOT_FOLDER}/`,
      version: undefined,
    } as unknown as DialApplicationResource,
    etag,
  );
}

export async function removePlatformApplication(path: string, etag?: string) {
  return removeApp(path, etag);
}

export async function bulkDeletePlatformApplications(paths: { path: string }[]) {
  return bulkDeleteApps(paths);
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
  return toolsetOpsApi.discoveredTools(token, name, ResourceType.APPLICATION);
}

export async function signInExternalService(
  appPath: string,
  serviceId: string,
  level: string,
  authType: string,
  redirectUri?: string,
  apiKey?: string,
  code?: string,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const body: Record<string, unknown> = {
    url: `applications/${encodeCorePath(appPath)}/external_services/${serviceId}`,
    credentialsLevel: level,
    authenticationType: authType,
    offline_usage_consent: true,
  };
  if (authType === ToolsetAuthType.OAUTH) {
    body.code = code;
    body.redirectUri = redirectUri;
  } else {
    body.apiKey = apiKey;
  }
  return externalServiceOpsApi.signIn(token, body);
}

export async function grantExternalServiceConsent(appPath: string, serviceId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return externalServiceConsentApi.grant(token, appPath, serviceId);
}

export async function withdrawExternalServiceConsent(appPath: string, serviceId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return externalServiceConsentApi.withdraw(token, appPath, serviceId);
}

export async function signOutExternalService(appPath: string, serviceId: string, level: string, authType: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return externalServiceOpsApi.signOut(token, {
    url: `applications/${encodeCorePath(appPath)}/external_services/${serviceId}`,
    credentialsLevel: level,
    authenticationType: authType,
  });
}
