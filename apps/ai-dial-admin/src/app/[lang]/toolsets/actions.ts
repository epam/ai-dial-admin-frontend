'use server';

import { cookies, headers } from 'next/headers';

import { toolSetsApi } from '@/src/app/api/api';
import { DialToolset } from '@/src/models/dial/toolset';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ToolsetTransport } from '@/src/types/toolset';

export async function removeToolset(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.removeToolset(token, name);
}

export async function updateToolset(toolSet: DialToolset) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.updateToolset(toolSet, token);
}

export async function createToolset(toolSet: DialToolset) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.createToolset({ ...toolSet, transport: ToolsetTransport.HTTP }, token);
}
