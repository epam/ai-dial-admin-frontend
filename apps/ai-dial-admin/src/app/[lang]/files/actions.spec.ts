import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetsApi } from '@/src/app/api/api';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { bulkDeleteFiles, exportFiles, getFiles, moveFiles, removeFile } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Files :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getFiles action', async () => {
    (assetsApi.getAssetList as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getFiles('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getAssetList).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.FILE);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeFile action', async () => {
    (assetsApi.removeAsset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeFile('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.removeAsset).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.FILE);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call moveFiles action', async () => {
    (assetsApi.moveAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await moveFiles(['path'], 'newPath');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.moveAssets).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ['path'],
      'newPath',
      ResourceType.FILE,
      undefined,
      undefined,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call exportFiles action', async () => {
    (assetsApi.exportFiles as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await exportFiles(['test']);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.exportFiles).toHaveBeenCalledWith(TOKEN_MOCK, ['test']);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeleteFiles action', async () => {
    (assetsApi.bulkDeleteAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await bulkDeleteFiles([{ path: 'path' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.bulkDeleteAssets).toHaveBeenCalledWith(TOKEN_MOCK, [{ path: 'path' }], ResourceType.FILE);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
