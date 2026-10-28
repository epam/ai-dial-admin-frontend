import { describe, expect, test, vi } from 'vitest';

import { ResourceType } from '@/src/types/resource-type';
import { moveAssets } from '../move';

describe('Server :: Assets :: move :: moveAssets', () => {
  test.each([ResourceType.APPLICATION, ResourceType.TOOLSET])(
    'preserves the final text suffix exactly once for %s',
    async (type) => {
      const assetApi = { move: vi.fn().mockResolvedValue({ success: true }) } as any;
      await moveAssets(
        assetApi,
        'token' as any,
        type,
        ['public/folder__literal/assistant__internal__release candidate'],
        'public/target',
        false,
        'copy__internal',
      );
      expect(assetApi.move).toHaveBeenCalledWith(
        'token',
        type,
        'public/folder__literal/assistant__internal__release candidate',
        'public/target/copy__internal__release candidate',
        false,
      );
    },
  );
  test('does not parse a delimiter in a parent folder as a resource version', async () => {
    const assetApi = { move: vi.fn().mockResolvedValue({ success: true }) } as any;
    await moveAssets(
      assetApi,
      'token' as any,
      ResourceType.APPLICATION,
      ['public/folder__stable/assistant'],
      'public/target',
      false,
      'copy',
    );
    expect(assetApi.move).toHaveBeenCalledWith(
      'token',
      ResourceType.APPLICATION,
      'public/folder__stable/assistant',
      'public/target/copy',
      false,
    );
  });
  test('preserves an untouched legacy empty suffix when a destination base name is provided', async () => {
    const assetApi = { move: vi.fn().mockResolvedValue({ success: true }) } as any;
    await moveAssets(
      assetApi,
      'token' as any,
      ResourceType.APPLICATION,
      ['public/assistant__'],
      'public/target',
      false,
      'copy',
    );
    expect(assetApi.move).toHaveBeenCalledWith(
      'token',
      ResourceType.APPLICATION,
      'public/assistant__',
      'public/target/copy__',
      false,
    );
  });
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
