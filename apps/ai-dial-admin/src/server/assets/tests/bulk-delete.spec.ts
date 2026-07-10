import { describe, expect, test, vi } from 'vitest';

import { ResourceType } from '@/src/types/resource-type';
import { bulkDeleteAssets } from '../bulk-delete';

describe('Server :: Assets :: bulk-delete :: bulkDeleteAssets', () => {
  test('deletes each item and reports success', async () => {
    const assetApi = { delete: vi.fn().mockResolvedValue({ success: true }) } as any;

    const result = await bulkDeleteAssets(assetApi, 'token' as any, ResourceType.PROMPT, [
      { path: 'a' },
      { path: 'b' },
    ]);

    expect(assetApi.delete).toHaveBeenCalledTimes(2);
    expect(assetApi.delete).toHaveBeenCalledWith('token', ResourceType.PROMPT, 'a');
    expect(result).toEqual({ success: true });
  });

  test('stops at the first failure (fail-fast)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    const assetApi = { delete: vi.fn().mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true }) } as any;

    const result = await bulkDeleteAssets(assetApi, 'token' as any, ResourceType.PROMPT, [
      { path: 'a' },
      { path: 'b' },
    ]);

    expect(assetApi.delete).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });
});
