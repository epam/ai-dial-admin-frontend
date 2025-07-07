'use server';

import { cookies, headers } from 'next/headers';

import { utilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { IMPORT_CONFIG_URL, PREVIEW_IMPORT_CONFIG_URL, PREVIEW_IMPORT_ZIP_CONFIG_URL } from '@/src/server/utility-api';

export async function importJsonConfigs(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importJsonConfigs(IMPORT_CONFIG_URL, token, file);
}

export async function importZipConfig(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importZipConfig(IMPORT_CONFIG_URL, token, file);
}

export async function previewJsonConfigs(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importJsonConfigs(PREVIEW_IMPORT_CONFIG_URL, token, file);
}

export async function previewZipConfig(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importZipConfig(PREVIEW_IMPORT_ZIP_CONFIG_URL, token, file);
}
