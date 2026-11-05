'use server';

import { cookies, headers } from 'next/headers';

import { assetApi } from '@/src/app/api/api';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { deleteCostObjectFolder } from '@/src/server/assets/delete-cost-object-folder';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getPolicyRecordPath } from '@/src/utils/policies/path';
import { toPolicyPayload } from '@/src/utils/policies/payload';

type PolicyEntity = DialPolicyResource & { folderId?: string };

const getPath = (policy: PolicyEntity): string =>
  getPolicyRecordPath(policy.name, policy.folderId ?? policy._metadata?.folderId);

export async function getPolicies(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.POLICY, path);
}

export async function createPolicy(policy: PolicyEntity) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.POLICY, getPath(policy), toPolicyPayload(policy));
}

export async function getPolicy(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialPolicyResource>(token, ResourceType.POLICY, path, etag);
}

export async function updatePolicy(policy: PolicyEntity, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.POLICY, getPath(policy), toPolicyPayload(policy), { etag });
}

export async function removePolicy(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.POLICY, path, etag);
}

/** Deletes every policy of a cost object folder; the folder then disappears, as Core keeps none of its own. */
export async function removePolicyFolder(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return deleteCostObjectFolder(assetApi, token, ResourceType.POLICY, path);
}

export async function bulkDeletePolicies(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.POLICY, paths);
}
