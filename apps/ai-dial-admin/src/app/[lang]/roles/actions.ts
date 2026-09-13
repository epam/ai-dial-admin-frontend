'use server';

import { cookies, headers } from 'next/headers';

import { configFileApi, rolesApi } from '@/src/app/api/api';
import { DialRole } from '@/src/models/dial/role';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function removeRole(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.removeRole(token, name);
}

/** `config-file-entity-views`: reads a role by name from Core's config-file population directly. */
export async function getConfigFileRole(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialRole>(token, ConfigFileEntityType.Roles, name);
}

export async function updateRole(role: DialRole, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.updateRole(role, token, eTag);
}

export async function createRole(role: DialRole) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.createRole(role, token);
}

export async function getCoreRole(role: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.getCoreRole(role, token);
}

export async function updateCoreRole(role: DialRole, name: string, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return rolesApi.updateCoreRole(role, name, eTag, token);
}
