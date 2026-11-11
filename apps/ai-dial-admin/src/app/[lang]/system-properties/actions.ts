'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi, sessionsSourceApi, settingsApi } from '@/src/app/api/api';
import { AnalyticsEntity, AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { SessionsSourceSetting } from '@/src/models/analytics/sessions-source';
import { ServerActionResponse } from '@/src/models/server-action';
import { GlobalSettings } from '@/src/models/system-properties';
import { withEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

export async function getProperties(etag: string) {
  return settingsApi.getSystemProperties(await token(), etag);
}

export async function updateProperties(properties: GlobalSettings, etag: string | undefined) {
  return settingsApi.updateSystemProperties(properties, await token(), etag);
}

export async function getSessionsSource(): Promise<ServerActionResponse<SessionsSourceSetting>> {
  return sessionsSourceApi.getSetting(await token());
}

export async function saveSessionsSource(
  setting: SessionsSourceSetting,
): Promise<ServerActionResponse<SessionsSourceSetting>> {
  return sessionsSourceApi.putSetting(setting, await token());
}

export async function getSessionsSourceEntities(): Promise<ServerActionResponse<AnalyticsEntity[]>> {
  return analyticsDataApi.getEntities(await token());
}

export async function getSessionsSourceSchema(name: string): Promise<ServerActionResponse<AnalyticsEntitySchema>> {
  const authToken = await token();
  return withEntitySchemaCache(name, authToken, () => analyticsDataApi.getEntitySchema(name, authToken));
}
