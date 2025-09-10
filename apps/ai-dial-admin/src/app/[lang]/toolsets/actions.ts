'use server';

import { cookies, headers } from 'next/headers';

import { toolSetsApi } from '@/src/app/api/api';
import { Toolset } from '@/src/models/dial/toolset';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ToolsetTransport } from '@/src/types/toolset';

export async function removeToolset(name?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.removeToolset(token, name);
}

export async function getTools(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.getTools(name, token);
}

export async function updateToolset(toolSet: Toolset) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.updateToolset(toolSet, token);
}

export async function createToolset(toolSet: Toolset) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const transport =
    toolSet.endpoint?.includes('http') || toolSet.endpoint?.includes('https')
      ? ToolsetTransport.HTTP
      : ToolsetTransport.SSE;

  return toolSetsApi.createToolset(
    { ...toolSet, allowedTools: toolSet.allowedTools?.filter((tool) => tool !== ''), transport },
    token,
  );
}
