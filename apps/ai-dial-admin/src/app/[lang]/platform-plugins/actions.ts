'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, configFileApi } from '@/src/app/api/api';
import { DialPluginResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ConfigFileEntityType } from '@/src/types/config-file-entity';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

/**
 * Core's `Plugin` accepts `type` and `settings` only and rejects any other field, so the body is built
 * from those two rather than by stripping what the client adds (`_metadata`, the create form's `name`,
 * the timestamp pair). `type` is trimmed because Core refuses a blank one.
 */
function toPluginPayload(plugin: DialPluginResource) {
  return { type: plugin.type?.trim(), settings: plugin.settings ?? {} };
}

/**
 * The resource name a plugin write addresses: flat on a create-flow entity (the form seeds it),
 * `_metadata`-nested on a fetched one.
 */
const pluginResourceName = (plugin: DialPluginResource): string => plugin.name ?? plugin._metadata?.name ?? '';

export async function getPlugins(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.PLUGIN, path);
}

export async function createPlugin(plugin: DialPluginResource) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.PLUGIN, pluginResourceName(plugin), toPluginPayload(plugin));
}

export async function getPlugin(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialPluginResource>(token, ResourceType.PLUGIN, path, etag);
}

export async function getConfigFilePlugins() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.listNames(token, ConfigFileEntityType.Plugins);
}

export async function getConfigFilePlugin(name: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return configFileApi.getEntity<DialPluginResource>(token, ConfigFileEntityType.Plugins, name);
}

export async function updatePlugin(plugin: DialPluginResource, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.PLUGIN, pluginResourceName(plugin), toPluginPayload(plugin), { etag });
}

export async function removePlugin(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.PLUGIN, path, etag);
}

export async function bulkDeletePlugins(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.PLUGIN, paths);
}
