'use server';

import { cookies, headers } from 'next/headers';

import { keysApi } from '@/src/app/api/api';
import { DialKey } from '@/src/models/dial/key';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function removeKey(key?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return keysApi.removeKey(token, key);
}

export async function updateKey(key: DialKey, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return keysApi.updateKey(key, token, eTag);
}

export async function getCoreKey(key: string, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return keysApi.getCoreKey(key, eTag, token);
}

export async function updateCoreKey(key: DialKey, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return keysApi.updateCoreKey(key, eTag, token);
}

export async function createKey(key: DialKey) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return keysApi.createKey(key, token);
}
