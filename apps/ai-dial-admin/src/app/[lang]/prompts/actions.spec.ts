import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeletePrompts,
  removePrompt,
  movePrompts,
  createPrompt,
  exportPrompts,
  getPrompt,
  getPrompts,
  updatePrompt,
} from './actions';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ResourceType } from '@/src/types/resource-type';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets Prompt :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getPrompts action', async () => {
    (assetsApi.getAssetList as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getPrompts('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getAssetList).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.PROMPT);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getPrompt action', async () => {
    (assetsApi.getAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);
    (assetsApi.getAssetList as any).mockResolvedValue([{ name: 'test', version: '1.0.0', path: 'path' }]);

    const result = await getPrompt('path', 'test', '1.0.0', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getAssetWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, 'path', ResourceType.PROMPT, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createPrompt action', async () => {
    (assetsApi.createAsset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createPrompt({
      folderId: 'public',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
      content: 'test',
    });
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.createAsset).toHaveBeenCalledWith(
      {
        folderId: 'public',
        nodeType: DialFileNodeType.FOLDER,
        path: 'test',
        version: '1.0',
        content: 'test',
      },
      ResourceType.PROMPT,
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createPrompt action', async () => {
    (assetsApi.createAsset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createPrompt({
      folderId: 'public',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
    } as any);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.createAsset).toHaveBeenCalledWith(
      {
        folderId: 'public',
        nodeType: DialFileNodeType.FOLDER,
        path: 'test',
        version: '1.0',
        content: '',
      },
      ResourceType.PROMPT,
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removePrompt action', async () => {
    (assetsApi.removeAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    await removePrompt('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.removeAssetWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.PROMPT, undefined);
  });

  test('Should call exportPrompts action', async () => {
    (assetsApi.exportAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await exportPrompts(['test']);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.exportAssets).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, ['test'], void 0);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updatePrompt action', async () => {
    (assetsApi.updateAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updatePrompt(
      {
        folderId: 'public',
        nodeType: DialFileNodeType.FOLDER,
        path: 'test',
        version: '1.0',
        content: 'content',
      },
      'etag',
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.updateAssetWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      {
        folderId: 'public',
        nodeType: DialFileNodeType.FOLDER,
        path: 'test',
        version: '1.0',
        content: 'content',
      },
      ResourceType.PROMPT,
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call movePrompts action', async () => {
    (assetsApi.moveAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await movePrompts(['path'], 'newPath');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.moveAssets).toHaveBeenCalledWith(TOKEN_MOCK, ['path'], 'newPath', ResourceType.PROMPT);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeletePrompts action', async () => {
    (assetsApi.bulkDeleteAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await bulkDeletePrompts([{ path: 'path' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.bulkDeleteAssets).toHaveBeenCalledWith(TOKEN_MOCK, [{ path: 'path' }], ResourceType.PROMPT);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
