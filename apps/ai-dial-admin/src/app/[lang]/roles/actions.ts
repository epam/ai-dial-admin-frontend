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

export async function updateRole(role: DialRole, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.updateRole(role, token, eTag);
}

export async function createRole(role: DialRole) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.createRole(role, token);
}

export async function getCoreRole(role: string, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.getCoreRole(role, eTag, token);
}

export async function updateCoreRole(role: DialRole, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.updateCoreRole(role, eTag, token);
}
