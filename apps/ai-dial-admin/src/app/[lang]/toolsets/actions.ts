'use server';

import { cookies, headers } from 'next/headers';

import { configFileApi, toolSetsApi } from '@/src/app/api/api';
import { Toolset, ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getAllowTools, getTransport } from '@/src/utils/toolset/toolset-transport';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getCoreToolset(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.getCoreToolset(name, token);
}

/** `config-file-entity-views`: reads a toolset by name from Core's config-file population directly. */
export async function getConfigFileToolset(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<Toolset>(token, ConfigFileEntityType.Toolsets, name);
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

export async function tryOutTool(name: string, body: Record<string, unknown>) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.tryOutTool(name, body, token);
}

export async function signInToolset(
  toolset: Toolset,
  type: ToolsetAuthCredentialLevel,
  redirectUri: string,
  apiKey?: string,
  authCode?: string,
) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.signInToolset(toolset, redirectUri, type, token, apiKey, authCode);
}

export async function signOutToolset(toolset: Toolset, type: ToolsetAuthCredentialLevel) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return toolSetsApi.signOutToolset(toolset, type, token);
}
