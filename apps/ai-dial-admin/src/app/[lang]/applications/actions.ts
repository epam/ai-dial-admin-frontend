'use server';

import { cookies, headers } from 'next/headers';

import { applicationsApi } from '@/src/app/api/api';
import { convertDefaultsToRecord } from '@/src/components/Defaults/utils';
import { DEFAULT_ROLE_LIMITS } from '@/src/constants/role';
import { DialApplication } from '@/src/models/dial/application';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getAppRoutes } from '@/src/utils/entities/app-routes';

export async function getApplications() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.getApplicationsListAction(token);
}

export async function getApplication(name: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.getApplication(name, token, etag);
}

export async function removeApplication(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.removeApplication(token, name);
}

export async function createApplication(application: DialApplication) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.createApplication({ ...application, ...DEFAULT_ROLE_LIMITS }, token);
}

export async function updateApplication(application: DialApplication, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const defaults = application.defaultsTemp
    ? { ...convertDefaultsToRecord(application.defaultsTemp) }
    : { ...application.defaults };

  const applicationProperties = application.applicationPropertiesTemp
    ? { ...convertDefaultsToRecord(application.applicationPropertiesTemp) }
    : { ...application.applicationProperties };

  const app = {
    ...application,
    routes: getAppRoutes(application.routes),
    defaults,
    applicationProperties,
  };
  delete app.defaultsTemp;
  delete app.applicationPropertiesTemp;

  return applicationsApi.updateApplication(app, token, etag);
}

export async function getCoreApplication(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.getCoreApplication(name, token);
}

export async function updateCoreApplication(app: DialApplication, name: string, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.updateCoreApplication(app, name, eTag, token);
}

export async function getTools(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.getTools(name, token);
}

export async function tryOutTool(name: string, body: Record<string, unknown>) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.tryOutTool(name, body, token);
}
