'use server';

import { cookies, headers } from 'next/headers';

import { rolesApi } from '@/src/app/api/api';
import { DialRole } from '@/src/models/dial/role';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function removeRole(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.removeRole(token, name);
}

export async function updateRole(role: DialRole) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.updateRole(role, token);
}

export async function createRole(role: DialRole) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.createRole(role, token);
}
