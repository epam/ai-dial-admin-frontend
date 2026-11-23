'use server';

import { cookies, headers } from 'next/headers';

import { assetApi } from '@/src/app/api/api';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getPolicyRecordPath } from '@/src/utils/policies/path';
import { toAssignmentPayload } from '@/src/utils/policies/payload';

type AssignmentEntity = DialPolicyAssignmentResource & { folderId?: string };

const getPath = (assignment: AssignmentEntity): string =>
  getPolicyRecordPath(assignment.name, assignment.folderId ?? assignment._metadata?.folderId);

export async function getPolicyAssignments(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.list(token, ResourceType.POLICY_ASSIGNMENT, path);
}

export async function createPolicyAssignment(assignment: AssignmentEntity) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.POLICY_ASSIGNMENT, getPath(assignment), toAssignmentPayload(assignment));
}

export async function getPolicyAssignment(path: string, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.getMergedWithEtag<DialPolicyAssignmentResource>(token, ResourceType.POLICY_ASSIGNMENT, path, etag);
}

export async function updatePolicyAssignment(assignment: AssignmentEntity, etag: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.put(token, ResourceType.POLICY_ASSIGNMENT, getPath(assignment), toAssignmentPayload(assignment), {
    etag,
  });
}

export async function removePolicyAssignment(path: string, etag?: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return assetApi.delete(token, ResourceType.POLICY_ASSIGNMENT, path, etag);
}

export async function bulkDeletePolicyAssignments(paths: { path: string }[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return bulkDeleteAssets(assetApi, token, ResourceType.POLICY_ASSIGNMENT, paths);
}
