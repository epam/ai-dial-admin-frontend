'use server';

import { cookies, headers } from 'next/headers';

import { settingsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { GlobalSettings } from '@/src/models/system-properties';

export async function getProperties(etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return settingsApi.getSystemProperties(token, etag);
}

export async function updateProperties(properties: GlobalSettings, etag: string | undefined) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return settingsApi.updateSystemProperties(properties, token, etag);
}
