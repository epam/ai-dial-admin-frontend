'use server';

import { cookies, headers } from 'next/headers';

import { addonsApi } from '@/src/app/api/api';
import { DEFAULT_ROLE_LIMITS } from '@/src/constants/role';
import { DialAddon } from '@/src/models/dial/addon';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function removeAddon(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return addonsApi.removeAddon(token, name);
}

export async function updateAddon(addon: DialAddon) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return addonsApi.updateAddon(addon, token);
}

export async function createAddon(addon: DialAddon) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return addonsApi.createAddon({ ...addon, ...DEFAULT_ROLE_LIMITS }, token);
}
