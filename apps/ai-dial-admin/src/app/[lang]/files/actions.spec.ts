import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, filesCoreApi } from '@/src/app/api/api';
import * as exportModule from '@/src/server/files/export';
import { ResourceType } from '@/src/types/resource-type';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { bulkDeleteFiles, exportFiles, getFiles, moveFiles, removeFile } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/files/export');

describe('Files :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getFiles action', async () => {
    (filesCoreApi.getFileMetadata as any).mockResolvedValue({
      name: 'folder',
      items: [{ name: 'file.txt', url: 'files/public/file.txt', etag: 'etag-1', nodeType: 'ITEM' }],
    });

    const result = await getFiles('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(filesCoreApi.getFileMetadata).toHaveBeenCalledWith(TOKEN_MOCK, 'test', false);
    expect(result).toEqual([
      { name: 'file.txt', url: 'files/public/file.txt', path: 'public/file.txt', etag: 'etag-1', nodeType: 'item' },
    ]);
  });

  test('getFiles returns an empty array when the folder has no metadata', async () => {
    (filesCoreApi.getFileMetadata as any).mockResolvedValue(null);

    const result = await getFiles('test');

    expect(result).toEqual([]);
  });

  test('Should call removeFile action', async () => {
    (filesCoreApi.deleteFile as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeFile('test', 'etag-1');
    expect(getUserToken).toHaveBeenCalled();
    expect(filesCoreApi.deleteFile).toHaveBeenCalledWith(TOKEN_MOCK, 'test', 'etag-1');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call moveFiles action', async () => {
    (assetApi.move as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await moveFiles(['folder/path'], 'newFolder/');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.FILE,
      'folder/path',
      'newFolder//path',
      undefined,
    );
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('Should call exportFiles action', async () => {
    (exportModule.buildFilesExportZip as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await exportFiles(['test']);
    expect(getUserToken).toHaveBeenCalled();
    expect(exportModule.buildFilesExportZip).toHaveBeenCalledWith(filesCoreApi, TOKEN_MOCK, ['test']);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call bulkDeleteFiles action, deleting each item with its own etag', async () => {
    (filesCoreApi.deleteFile as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteFiles([{ path: 'path', etag: 'etag-1' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(filesCoreApi.deleteFile).toHaveBeenCalledWith(TOKEN_MOCK, 'path', 'etag-1');
    expect(result).toEqual({ success: true });
  });

  test('bulkDeleteFiles rejects the whole batch before calling Core if any item lacks an etag', async () => {
    (filesCoreApi.deleteFile as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteFiles([
      { path: 'a', etag: 'etag-1' },
      { path: 'b', etag: '' },
    ]);

    expect(result.success).toBe(false);
    expect(filesCoreApi.deleteFile).not.toHaveBeenCalled();
  });

  test('bulkDeleteFiles stops at the first failure (fail-fast)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    (filesCoreApi.deleteFile as any).mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true });

    const result = await bulkDeleteFiles([
      { path: 'a', etag: 'etag-1' },
      { path: 'b', etag: 'etag-2' },
    ]);

    expect(filesCoreApi.deleteFile).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });
});
