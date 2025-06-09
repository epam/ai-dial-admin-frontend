'use server';

import { cookies, headers } from 'next/headers';

import { foldersApi } from '@/src/app/api/api';
import { DialRule } from '@/src/models/dial/rule';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getFolders(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return foldersApi.getFolders(token, path);
}

export async function getRules(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return foldersApi.getRules(token, path);
}

export async function updateRules(targetFolder: string, rules: DialRule[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return foldersApi.updateRules(token, targetFolder, rules);
}
