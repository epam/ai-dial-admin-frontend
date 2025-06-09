'use server';

import { cookies, headers } from 'next/headers';

import { utilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function importConfig(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importConfig(token, file);
}

export async function importZipConfig(file: FormData) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.importZipConfig(token, file);
}
