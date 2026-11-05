import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi } from '@/src/app/api/api';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { deleteCostObjectFolder } from '@/src/server/assets/delete-cost-object-folder';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeletePolicyAssignments,
  createPolicyAssignment,
  getPolicyAssignment,
  getPolicyAssignments,
  removePolicyAssignment,
  updatePolicyAssignment,
  removePolicyAssignmentFolder,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/assets/bulk-delete');
vi.mock('@/src/server/assets/delete-cost-object-folder');

describe('Platform policy assignments :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('lists assignments under a cost object folder with the token', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getPolicyAssignments('team-a/');

    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY_ASSIGNMENT, 'team-a/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('reads one assignment with its etag', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getPolicyAssignment('team-a/grant-1', 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.POLICY_ASSIGNMENT,
      'team-a/grant-1',
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('writes an assignment into its cost object folder and derives costObject from it', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createPolicyAssignment({ name: 'grant-1', folderId: 'team-a/', policy: 'daily-cap' } as any);

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY_ASSIGNMENT, 'team-a/grant-1', {
      policy: 'daily-cap',
      costObject: 'team-a',
    });
  });

  test('createPolicyAssignment returns a Core rejection unchanged', async () => {
    const rejection = { success: false, errorHeader: 'Unprocessable', errorMessage: "Policy 'x' does not exist" };
    (assetApi.put as any).mockResolvedValue(rejection);

    expect(await createPolicyAssignment({ name: 'grant-1', folderId: 'team-a/', policy: 'x' } as any)).toBe(rejection);
  });

  test('updates with the etag and takes the folder from the merged read metadata', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updatePolicyAssignment(
      {
        name: 'grant-1',
        policy: 'daily-cap',
        ticket: 'T-1',
        _metadata: { name: 'grant-1', path: 'team-a/grant-1', folderId: 'team-a/' },
      },
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.POLICY_ASSIGNMENT,
      'team-a/grant-1',
      { policy: 'daily-cap', ticket: 'T-1', costObject: 'team-a' },
      { etag: 'etag' },
    );
  });

  test('removes an assignment conditionally on its etag', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removePolicyAssignment('team-a/grant-1', 'etag');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY_ASSIGNMENT, 'team-a/grant-1', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('bulk-deletes through the shared fail-fast helper', async () => {
    (bulkDeleteAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await bulkDeletePolicyAssignments([{ path: 'team-a/a' }]);

    expect(bulkDeleteAssets).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, ResourceType.POLICY_ASSIGNMENT, [
      { path: 'team-a/a' },
    ]);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('deletes a cost object folder through the folder helper with the token', async () => {
    vi.mocked(deleteCostObjectFolder).mockResolvedValue({ success: true });

    const result = await removePolicyAssignmentFolder('team-a/');

    expect(deleteCostObjectFolder).toHaveBeenCalledWith(
      assetApi,
      TOKEN_MOCK,
      ResourceType.POLICY_ASSIGNMENT,
      'team-a/',
    );
    expect(result).toEqual({ success: true });
  });
});
