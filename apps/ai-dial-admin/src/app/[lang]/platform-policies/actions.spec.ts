import { beforeEach, describe, expect, test, vi } from 'vitest';

import { PolicySubjectFunction } from '@/src/models/dial/policy';
import { assetApi } from '@/src/app/api/api';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { deleteCostObjectFolder } from '@/src/server/assets/delete-cost-object-folder';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeletePolicies,
  createPolicy,
  getPolicies,
  getPolicy,
  removePolicy,
  removePolicyFolder,
  updatePolicy,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/assets/bulk-delete');
vi.mock('@/src/server/assets/delete-cost-object-folder');

const PAYLOAD = { priority: 10, object: '*', cost: { day: 5 }, kind: 'budget', quantity: 'cost', per: ['subject'] };

describe('Platform policies :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('lists policies under a folder with the token', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getPolicies('team-a/');

    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY, 'team-a/');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('reads one policy with its etag', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getPolicy('team-a/cap', 'etag');

    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY, 'team-a/cap', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('writes a global policy to its bare name, without identity or seeded fields', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createPolicy({
      name: 'daily-cap',
      folderId: 'platform/',
      description: '',
      priority: 10,
      object: '*',
      cost: { day: 5 },
    } as any);

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY, 'daily-cap', PAYLOAD);
  });

  test('writes a project policy under its cost object folder', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createPolicy({ name: 'team-cap', folderId: 'team-a/', priority: 10, object: '*', cost: { day: 5 } } as any);

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY, 'team-a/team-cap', PAYLOAD);
  });

  test('writes a project policy with its subjects and cost object in the body', async () => {
    vi.mocked(assetApi.put).mockResolvedValue(RESPONSE_MOCK);
    const subject = [{ source: 'roles', function: PolicySubjectFunction.TRUE, targets: [] }];

    await createPolicy({
      name: 'team-cap',
      folderId: 'platform/team-a/',
      priority: 10,
      object: '*',
      cost: { day: 5 },
      costObject: 'team-a',
      subject,
    });

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY, 'team-a/team-cap', {
      ...PAYLOAD,
      costObject: 'team-a',
      subject,
    });
  });

  test('createPolicy returns a Core rejection unchanged', async () => {
    const rejection = { success: false, errorHeader: 'Unprocessable', errorMessage: 'priority is required' };
    (assetApi.put as any).mockResolvedValue(rejection);

    expect(await createPolicy({ name: 'daily-cap' } as any)).toBe(rejection);
  });

  test('updates with the etag and takes the folder from the merged read metadata', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updatePolicy(
      {
        name: 'team-cap',
        priority: 10,
        object: '*',
        cost: { day: 5 },
        _metadata: { name: 'team-cap', path: 'team-a/team-cap', folderId: 'team-a/' },
      },
      'etag',
    );

    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY, 'team-a/team-cap', PAYLOAD, {
      etag: 'etag',
    });
  });

  test('removes a policy conditionally on its etag', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removePolicy('team-a/cap', 'etag');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY, 'team-a/cap', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('bulk-deletes through the shared fail-fast helper', async () => {
    (bulkDeleteAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await bulkDeletePolicies([{ path: 'a' }, { path: 'team-a/b' }]);

    expect(bulkDeleteAssets).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, ResourceType.POLICY, [
      { path: 'a' },
      { path: 'team-a/b' },
    ]);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('deletes a cost object folder through the folder helper with the token', async () => {
    vi.mocked(deleteCostObjectFolder).mockResolvedValue({ success: true });

    const result = await removePolicyFolder('team-a/');

    expect(deleteCostObjectFolder).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, ResourceType.POLICY, 'team-a/');
    expect(result).toEqual({ success: true });
  });
});
