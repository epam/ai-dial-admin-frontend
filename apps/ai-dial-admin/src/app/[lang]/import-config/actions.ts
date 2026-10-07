'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi, deploymentConfigApi, utilityApi } from '@/src/app/api/api';
import { CatalogImportPreview, CatalogImportResult } from '@/src/models/analytics/catalog-import';
import { ServerActionResponse } from '@/src/models/server-action';
import {
  IMPORT_CONFIG_URL,
  IMPORT_ZIP_CONFIG_URL,
  PREVIEW_IMPORT_CONFIG_URL,
  PREVIEW_IMPORT_ZIP_CONFIG_URL,
} from '@/src/server/utility-api';
import { CatalogResolutionPolicy } from '@/src/types/analytics/import';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function importJsonConfigs(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importJsonConfigs(IMPORT_CONFIG_URL, token, file);
}

export async function importZipConfig(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importZipConfig(IMPORT_ZIP_CONFIG_URL, token, file);
}

export async function previewJsonConfigs(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importJsonConfigs(PREVIEW_IMPORT_CONFIG_URL, token, file);
}

export async function previewZipConfig(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importZipConfig(PREVIEW_IMPORT_ZIP_CONFIG_URL, token, file);
}

export async function importDeploymentConfig(file: FormData, resolutionPolicy: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return deploymentConfigApi.importConfig(file, resolutionPolicy, token);
}

export async function previewDeploymentImportConfig(file: FormData, resolutionPolicy: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return deploymentConfigApi.previewImportConfig(file, resolutionPolicy, token);
}

export async function previewAnalyticsImportConfig(
  file: FormData,
  policy: CatalogResolutionPolicy,
  isReusedNamesAcknowledged: boolean,
): Promise<ServerActionResponse<CatalogImportPreview>> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return analyticsDataApi.previewCatalogImport(file, policy, isReusedNamesAcknowledged, token);
}

export async function importAnalyticsConfig(
  file: FormData,
  policy: CatalogResolutionPolicy,
  isReusedNamesAcknowledged: boolean,
): Promise<ServerActionResponse<CatalogImportResult>> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return analyticsDataApi.importCatalog(file, policy, isReusedNamesAcknowledged, token);
}
