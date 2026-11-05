import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DialFileNodeType } from '@/src/models/dial/file';
import { bulkDeleteAssets } from '@/src/server/assets/bulk-delete';
import { deleteCostObjectFolder } from '@/src/server/assets/delete-cost-object-folder';
import { AssetApi } from '@/src/server/core/asset-api';
import { ResourceType } from '@/src/types/resource-type';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/server/assets/bulk-delete');

const list = vi.fn();
const assetApi = { list } as unknown as AssetApi;

describe('deleteCostObjectFolder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bulkDeleteAssets).mockResolvedValue({ success: true });
  });

  test('lists the folder with its trailing slash and deletes each record in it', async () => {
    list.mockResolvedValue([
      { path: 'team-a/one', nodeType: DialFileNodeType.ITEM },
      { path: 'team-a/two', nodeType: DialFileNodeType.ITEM },
    ]);

    const result = await deleteCostObjectFolder(assetApi, TOKEN_MOCK, ResourceType.POLICY, 'team-a');

    expect(list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY, 'team-a/');
    expect(bulkDeleteAssets).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, ResourceType.POLICY, [
      { path: 'team-a/one' },
      { path: 'team-a/two' },
    ]);
    expect(result).toEqual({ success: true });
  });

  test('accepts the folder in the bucket-prefixed list form', async () => {
    list.mockResolvedValue([]);

    await deleteCostObjectFolder(assetApi, TOKEN_MOCK, ResourceType.POLICY_ASSIGNMENT, 'platform/team-a/');

    expect(list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.POLICY_ASSIGNMENT, 'team-a/');
  });

  test('skips sub-folder rows, deleting only records', async () => {
    list.mockResolvedValue([
      { path: 'team-a/one', nodeType: DialFileNodeType.ITEM },
      { path: 'team-a/nested/', nodeType: DialFileNodeType.FOLDER },
    ]);

    await deleteCostObjectFolder(assetApi, TOKEN_MOCK, ResourceType.POLICY, 'team-a/');

    expect(bulkDeleteAssets).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, ResourceType.POLICY, [{ path: 'team-a/one' }]);
  });

  test('returns the first failure Core reports, such as a policy an assignment still references', async () => {
    list.mockResolvedValue([{ path: 'team-a/one', nodeType: DialFileNodeType.ITEM }]);
    const failure = { success: false, errorHeader: 'Conflict', errorMessage: 'Policy is referenced' };
    vi.mocked(bulkDeleteAssets).mockResolvedValue(failure);

    expect(await deleteCostObjectFolder(assetApi, TOKEN_MOCK, ResourceType.POLICY, 'team-a/')).toBe(failure);
  });

  test.each([['platform/'], [''], ['platform']])('refuses the root %j, which is not a folder', async (path) => {
    const result = await deleteCostObjectFolder(assetApi, TOKEN_MOCK, ResourceType.POLICY, path);

    expect(result.success).toBe(false);
    expect(list).not.toHaveBeenCalled();
    expect(bulkDeleteAssets).not.toHaveBeenCalled();
  });
});
