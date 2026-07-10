import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, assetsApi } from '@/src/app/api/api';
import * as eximModule from '@/src/server/applications/exim';
import * as zipEximModule from '@/src/server/applications/zip-exim';
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
vi.mock('@/src/server/applications/exim');
vi.mock('@/src/server/applications/zip-exim');

describe('Assets application :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getApps action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getApps('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getApp action', async () => {
    (assetApi.list as any).mockResolvedValue([{ name: 'app', version: '1.0.0', path: 'app-path' }]);
    (assetApi.getMergedWithEtag as any).mockResolvedValue({
      success: true,
      response: { name: 'app', path: 'app-path' },
      etag: 'e1',
    });

    const result = await getApp('app-path', 'app', '1.0.0', 'etag');

    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'app-path/');
    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'app-path', 'etag');
    expect(assetsApi.getAsset).not.toHaveBeenCalled();
    expect(result.response?.validityState).toBeUndefined();
  });

  test('Should call importApps action for JSON import and delegate to importApplicationsExport', async () => {
    (eximModule.importApplicationsExport as any).mockResolvedValue({ importResults: [{ status: 'success' }] });

    const document = { applications: [{ id: 'applications/public/name__1.0' }] };
    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'override' })]));
    body.append('file', new Blob([JSON.stringify(document)]));

    const result = await importApps(body, ImportFileType.JSON);

    expect(getUserToken).toHaveBeenCalled();
    expect(eximModule.importApplicationsExport).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, document, {
      path: 'public/',
      conflictResolutionStrategy: 'override',
      flatImport: undefined,
    });
    expect(result).toEqual({ success: true, response: { importResults: [{ status: 'success' }] } });
  });

  test('importApps extracts a zip archive before delegating', async () => {
    (zipEximModule.extractApplicationsFromZip as any).mockResolvedValue({ applications: [] });
    (eximModule.importApplicationsExport as any).mockResolvedValue({ importResults: [] });

    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'skip' })]));
    body.append('file', new Blob(['zip-bytes']));

    const result = await importApps(body, ImportFileType.ARCHIVE);

    expect(zipEximModule.extractApplicationsFromZip).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  test('importApps rejects when the config part is missing', async () => {
    const result = await importApps(new FormData(), ImportFileType.JSON);

    expect(result.success).toBe(false);
  });

  test('Should call exportApps action for JSON export', async () => {
    (eximModule.buildApplicationsExport as any).mockResolvedValue({ applications: [] });

    const result = await exportApps(['test']);
    expect(getUserToken).toHaveBeenCalled();
    expect(eximModule.buildApplicationsExport).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, ['test']);
    expect(zipEximModule.buildApplicationsZip).not.toHaveBeenCalled();
    expect(result).toEqual({ applications: [] });
  });

  test('exportApps wraps the document as a zip for archive export', async () => {
    (eximModule.buildApplicationsExport as any).mockResolvedValue({ applications: [] });
    const blob = new Blob(['zip']);
    (zipEximModule.buildApplicationsZip as any).mockResolvedValue(blob);

    const result = await exportApps(['test'], ImportFileType.ARCHIVE);

    expect(zipEximModule.buildApplicationsZip).toHaveBeenCalledWith({ applications: [] });
    expect(result).toEqual({ blob, fileName: 'applications-export.zip' });
  });

  test('Should call updateApp action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

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
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'test',
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
      { etag: 'etag' },
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('updateApp rejects an out-of-range maxInputAttachments before calling Core', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateApp(
      {
        folderId: 'public',
        nodeType: DialFileNodeType.FOLDER,
        path: 'test',
        version: '1.0',
        maxInputAttachments: 2000,
      },
      'etag',
    );

    expect(result.success).toBe(false);
    expect(assetApi.put).not.toHaveBeenCalled();
  });

  test('Should call createApp action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createApp({
      folderId: 'public',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
    });
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'public__1.0', {
      folderId: 'public',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
      displayVersion: '1.0',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createApp rejects an invalid viewerUrl before calling Core', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createApp({
      folderId: 'public',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
      viewerUrl: 'https://exa mple.com',
    });

    expect(result.success).toBe(false);
    expect(assetApi.put).not.toHaveBeenCalled();
  });

  test('createApp conflict surfaces a recognizable error', async () => {
    (assetApi.put as any).mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'Application already exists',
    });

    const result = await createApp({
      folderId: 'public',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Application already exists');
  });

  test('Should call removeApp action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeApp('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'test', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('removeApp without an etag calls the Core client unconditionally', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    await removeApp('test');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'test', undefined);
  });

  test('Should call moveApps action', async () => {
    (assetApi.move as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await moveApps(['folder/path'], 'newFolder/');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'folder/path',
      'newFolder//path',
      undefined,
    );
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('moveApps with duplicateName keeps the source version suffix on the destination', async () => {
    (assetApi.move as any).mockResolvedValue(RESPONSE_MOCK);

    await moveApps(['folder/name__2'], 'folder/', false, 'copy');

    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'folder/name__2',
      'folder//copy__2',
      false,
    );
  });

  test('Should call bulkDeleteApps action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteApps([{ path: 'path' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.APPLICATION, 'path');
    expect(result).toEqual({ success: true });
  });

  test('bulkDeleteApps stops at the first failure (fail-fast)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    (assetApi.delete as any).mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true });

    const result = await bulkDeleteApps([{ path: 'a' }, { path: 'b' }]);

    expect(assetApi.delete).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });

  test('Should call getAssetTools action for APPLICATION resource type', async () => {
    (assetsApi.getTools as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getAssetTools('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.getTools).toHaveBeenCalledWith('test', TOKEN_MOCK, ResourceType.APPLICATION);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
