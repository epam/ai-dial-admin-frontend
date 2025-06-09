'use server';

import { cookies, headers } from 'next/headers';

import { adaptersApi } from '@/src/app/api/api';
import { DialAdapter } from '@/src/models/dial/adapter';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function removeAdapter(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return adaptersApi.removeAdapter(token, name);
}

export async function updateAdapter(adapter: DialAdapter) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return adaptersApi.updateAdapter(adapter, token);
}

export async function createAdapter(adapter: DialAdapter) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return adaptersApi.createAdapter(adapter, token);
}
