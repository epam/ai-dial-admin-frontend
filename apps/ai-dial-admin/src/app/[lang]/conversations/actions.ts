'use server';

import { cookies, headers } from 'next/headers';

import { assetApi, utilityApi } from '@/src/app/api/api';
import { DialConversation } from '@/src/models/dial/conversation';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

export async function getConversations(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.CONVERSATION, path);
}

export async function getConversation(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialConversation>(token, ResourceType.CONVERSATION, path, etag);
}

export async function deleteConversation(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.CONVERSATION, path, etag);
}

export async function deleteConversations(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.CONVERSATION, paths);
}

export async function getAllDeployments() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return utilityApi.getAllDeployments(token);
}
