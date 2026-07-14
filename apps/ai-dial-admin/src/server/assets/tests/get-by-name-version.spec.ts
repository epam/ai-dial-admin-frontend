import { describe, expect, test, vi } from 'vitest';

import { ResourceType } from '@/src/types/resource-type';
import { getAssetByNameVersion } from '../get-by-name-version';

describe('Server :: Assets :: get-by-name-version :: getAssetByNameVersion', () => {
  test('lists the folder, resolves the matching path, and fetches with etag', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([{ name: 'test', version: '1.0.0', path: 'path' }]),
      getMergedWithEtag: vi.fn().mockResolvedValue({ success: true, response: {} }),
    } as any;

    const result = await getAssetByNameVersion(
      assetApi,
      'token' as any,
      ResourceType.PROMPT,
      'folder',
      'test',
      '1.0.0',
      'etag',
    );

    expect(assetApi.list).toHaveBeenCalledWith('token', ResourceType.PROMPT, 'folder/');
    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith('token', ResourceType.PROMPT, 'path', 'etag');
    expect(result).toEqual({ success: true, response: {} });
  });

  test('returns a not-found response instead of calling Core when no item matches name+version', async () => {
    const assetApi = {
      list: vi.fn().mockResolvedValue([{ name: 'test', version: '1.0.0', path: 'path' }]),
      getMergedWithEtag: vi.fn(),
    } as any;

    const result = await getAssetByNameVersion(
      assetApi,
      'token' as any,
      ResourceType.PROMPT,
      'folder',
      'test',
      '2.0.0',
      'etag',
    );

    expect(assetApi.getMergedWithEtag).not.toHaveBeenCalled();
    expect(result).toEqual({ success: false, errorHeader: 'Not Found', errorMessage: 'Resource not found' });
  });
});
