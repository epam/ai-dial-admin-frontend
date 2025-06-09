'use server';

import { cookies, headers } from 'next/headers';

import { applicationsApi } from '@/src/app/api/api';
import { DEFAULT_ROLE_LIMITS } from '@/src/constants/role';
import { DialApplication } from '@/src/models/dial/application';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getApplications() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.getApplicationsList(token);
}

export async function removeApplication(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.removeApplication(token, name);
}

export async function createApplication(application: DialApplication) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.createApplication({ ...application, ...DEFAULT_ROLE_LIMITS }, token);
}

export async function updateApplication(application: DialApplication) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return applicationsApi.updateApplication(application, token);
}
