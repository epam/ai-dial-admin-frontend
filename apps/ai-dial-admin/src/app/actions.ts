'use server';

import { cookies, headers } from 'next/headers';

import { utilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { AppProcessStatus } from '@/src/models/app-process-status';

export async function reloadConfig() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.reloadConfig(token);
}

export async function checkIsUniqueDeploymentName(name: string): Promise<boolean> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const response = await utilityApi.checkDeploymentByName(name, token);
  return response === null;
}

export async function getAppProcessStatus(): Promise<AppProcessStatus | null> {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.getAppProcessStatus(token);
}
