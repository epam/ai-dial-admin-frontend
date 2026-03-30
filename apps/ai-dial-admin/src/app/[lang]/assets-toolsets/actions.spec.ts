import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  getToolsets,
  removeToolset,
  moveToolsets,
  bulkDeleteToolsets,
  getToolset,
  updateToolset,
  signInToolset,
  getAssetTools,
  createToolset,
  signOutToolset,
  importToolsets,
  exportToolsets,
  tryOutAssetTool,
} from './actions';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ResourceType } from '@/src/types/resource-type';
import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { ImportFileType } from '@/src/types/import';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets Toolset :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getToolsets action', async () => {
    (assetsApi.getAssetList as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getToolsets('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getAssetList).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.TOOLSET);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getToolset action', async () => {
    (assetsApi.getAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);
    (assetsApi.getAssetList as any).mockResolvedValue([{ name: 'test', version: '1.0.0', path: 'path' }]);

    const result = await getToolset('path', 'test', '1.0.0', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getAssetWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, 'path', ResourceType.TOOLSET, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateToolset action', async () => {
    (assetsApi.updateAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateToolset(
      {
        folderId: 'public',
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
        path: 'test',
        version: '1.0',
        displayVersion: '1.0',
      },
      ResourceType.TOOLSET,
      'etag',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createToolset action', async () => {
    (assetsApi.createAsset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createToolset({
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
        allowedTools: void 0,
        transport: 'sse',
        displayVersion: '1.0',
      },
      ResourceType.TOOLSET,
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeToolset action', async () => {
    (assetsApi.removeAssetWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeToolset('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.removeAssetWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, 'test', ResourceType.TOOLSET, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call moveToolsets action', async () => {
    (assetsApi.moveAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await moveToolsets(['path'], 'newPath');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.moveAssets).toHaveBeenCalledWith(TOKEN_MOCK, ['path'], 'newPath', ResourceType.TOOLSET);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeleteToolsets action', async () => {
    (assetsApi.bulkDeleteAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await bulkDeleteToolsets([{ path: 'path' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.bulkDeleteAssets).toHaveBeenCalledWith(TOKEN_MOCK, [{ path: 'path' }], ResourceType.TOOLSET);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getAssetTools action', async () => {
    (assetsApi.getTools as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getAssetTools('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getTools).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call exportToolsets action', async () => {
    (assetsApi.exportAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await exportToolsets(['test']);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.exportAssets).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TOOLSET, ['test'], void 0);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call signInToolset action', async () => {
    (assetsApi.signInToolset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await signInToolset(
      { path: 'path', folderId: 'test', nodeType: DialFileNodeType.FOLDER, version: '1.0' },
      ToolsetAuthCredentialLevel.GLOBAL,
      'https://redirect.example.com/callback',
      'key',
      'code',
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.signInToolset).toHaveBeenCalledWith(
      { path: 'path', folderId: 'test', nodeType: DialFileNodeType.FOLDER, version: '1.0' },
      ToolsetAuthCredentialLevel.GLOBAL,
      TOKEN_MOCK,
      'https://redirect.example.com/callback',
      'key',
      'code',
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call signOutToolset action', async () => {
    (assetsApi.signOutToolset as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await signOutToolset(
      { path: 'path', folderId: 'test', nodeType: DialFileNodeType.FOLDER, version: '1.0' },
      ToolsetAuthCredentialLevel.GLOBAL,
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.signOutToolset).toHaveBeenCalledWith(
      { path: 'path', folderId: 'test', nodeType: DialFileNodeType.FOLDER, version: '1.0' },
      ToolsetAuthCredentialLevel.GLOBAL,
      TOKEN_MOCK,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call importToolsets action', async () => {
    (assetsApi.importAssets as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await importToolsets({} as FormData, ImportFileType.ARCHIVE);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.importAssets).toHaveBeenCalledWith(
      TOKEN_MOCK,
      {} as FormData,
      ImportFileType.ARCHIVE,
      ResourceType.TOOLSET,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call tryOutAssetTool action', async () => {
    (assetsApi.tryOutTool as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await tryOutAssetTool({});
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.tryOutTool).toHaveBeenCalledWith({}, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
