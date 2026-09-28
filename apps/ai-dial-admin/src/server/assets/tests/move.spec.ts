import { describe, expect, test, vi } from 'vitest';

import { ResourceType } from '@/src/types/resource-type';
import { moveAssets } from '../move';

describe('Server :: Assets :: move :: moveAssets', () => {
  test('moves each path to the new folder', async () => {
    const assetApi = { move: vi.fn().mockResolvedValue({ success: true }) } as any;

    const result = await moveAssets(assetApi, 'token' as any, ResourceType.PROMPT, ['folder/path'], 'newFolder/');

    expect(assetApi.move).toHaveBeenCalledWith(
      'token',
      ResourceType.PROMPT,
      'folder/path',
      'newFolder//path',
      undefined,
    );
    expect(result).toEqual([{ success: true }]);
  });

  test('duplicateName uses the name verbatim — a `__` in the source name is part of the name, not a version to graft', async () => {
    const assetApi = { move: vi.fn().mockResolvedValue({ success: true }) } as any;

    await moveAssets(assetApi, 'token' as any, ResourceType.PROMPT, ['folder/name__2'], 'folder/', false, 'copy');

    expect(assetApi.move).toHaveBeenCalledWith('token', ResourceType.PROMPT, 'folder/name__2', 'folder//copy', false);
  });
});
