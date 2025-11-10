'use server';

import { cookies, headers } from 'next/headers';

import { deploymentsApi, toolSetsApi } from '@/src/app/api/api';
import { Toolset } from '@/src/models/dial/toolset';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getAllowTools, getTransport } from '@/src/utils/toolset/toolset-transport';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getCoreToolset(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.getCoreToolset(name, token);
}

export async function updateCoreToolset(toolset: Toolset, name: string, eTag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.updateCoreToolset(toolset, name, eTag, token);
}

export async function removeToolset(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.removeToolset(token, name);
}

export async function getTools(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.getTools(name, token);
}

export async function updateToolset(toolSet: Toolset, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.updateToolset(toolSet, token, etag);
}

export async function createToolset(toolSet: Toolset) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());

  return toolSetsApi.createToolset(
    { ...toolSet, allowedTools: getAllowTools(toolSet), transport: getTransport(toolSet) },
    token,
  );
}

export async function getToolsetContainers() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return deploymentsApi.getMcpContainers(token);
}
