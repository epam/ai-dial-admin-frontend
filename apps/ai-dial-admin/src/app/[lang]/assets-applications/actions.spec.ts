import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  getApps,
  removeApp,
  moveApps,
  bulkDeleteApps,
  getApp,
  updateApp,
  createApp,
  importApps,
  exportApps,
  getAssetTools,
} from './actions';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ResourceType } from '@/src/types/resource-type';
import { ImportFileType } from '@/src/types/import';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets application :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getApps action', async () => {
    (assetsApi.getAssetList as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getApps('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getAssetList).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.APPLICATION);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getApp action', async () => {
    (assetsApi.getAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);
    (assetsApi.getAssetList as any).mockResolvedValue([{ name: 'app', version: '1.0.0', path: 'app-path' }]);

    const result = await getApp('app-path', 'app', '1.0.0', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getAssetWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, 'app-path', ResourceType.APPLICATION, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call importApps action', async () => {
    (assetsApi.importAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await importApps({} as FormData, ImportFileType.ARCHIVE);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.importAssets).toHaveBeenCalledWith(
      TOKEN_MOCK,
      {} as FormData,
      ImportFileType.ARCHIVE,
      ResourceType.APPLICATION,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call exportApps action', async () => {
    (assetsApi.exportAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await exportApps(['test']);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.exportAssets).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, ['test'], void 0);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateApp action', async () => {
    (assetsApi.updateAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateApp(
      {
        folderId: 'public',
        applicationProperties: { key: 'value' },
        defaults: { key: 'value' },
        nodeType: DialFileNodeType.FOLDER,
        path: 'test',
        version: '1.0',
      },
      'etag',
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.updateAssetWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      {
        folderId: 'public',
        nodeType: DialFileNodeType.FOLDER,
        applicationProperties: { key: 'value' },
        defaults: { key: 'value' },
        responsesDefaults: {},
        path: 'test',
        version: '1.0',
        displayVersion: '1.0',
      },
      ResourceType.APPLICATION,
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateApp action', async () => {
    (assetsApi.updateAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateApp(
      { folderId: 'public', nodeType: DialFileNodeType.FOLDER, path: 'test', version: '1.0' },
      'etag',
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.updateAssetWithEtag).toHaveBeenCalledWith(
      TOKEN_MOCK,
      {
        folderId: 'public',
        nodeType: DialFileNodeType.FOLDER,
        applicationProperties: {},
        defaults: {},
        responsesDefaults: {},
        path: 'test',
        version: '1.0',
        displayVersion: '1.0',
      },
      ResourceType.APPLICATION,
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createApp action', async () => {
    (assetsApi.createAsset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createApp({
      folderId: 'public',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
    });
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.createAsset).toHaveBeenCalledWith(
      {
        folderId: 'public',
        nodeType: DialFileNodeType.FOLDER,
        path: 'test',
        version: '1.0',
        displayVersion: '1.0',
      },
      ResourceType.APPLICATION,
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeApp action', async () => {
    (assetsApi.removeAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeApp('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.removeAssetWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.APPLICATION, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call moveApps action', async () => {
    (assetsApi.moveAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await moveApps(['path'], 'newPath');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.moveAssets).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ['path'],
      'newPath',
      ResourceType.APPLICATION,
      undefined,
      undefined,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeleteApps action', async () => {
    (assetsApi.bulkDeleteAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await bulkDeleteApps([{ path: 'path' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.bulkDeleteAssets).toHaveBeenCalledWith(TOKEN_MOCK, [{ path: 'path' }], ResourceType.APPLICATION);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getAssetTools action for APPLICATION resource type', async () => {
    (assetsApi.getTools as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getAssetTools('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getTools).toHaveBeenCalledWith('test', TOKEN_MOCK, ResourceType.APPLICATION);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
