import { beforeEach, describe, expect, test, vi } from 'vitest';

import { foldersApi } from '@/src/app/api/api';
import * as foldersCore from '@/src/server/folders/folders-core';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  changeFolder,
  createFolderWithFiles,
  getFolders,
  getRules,
  previewAppZip,
  previewToolsetZip,
  removeFolder,
  updateRules,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/folders/folders-core');

describe('Folders storage :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test("getFolders returns the merged tree's top-level items", async () => {
    (foldersCore.getFoldersCore as any).mockResolvedValue({ name: 'public', items: [{ name: 'sub' }] });

    const result = await getFolders('public/');

    expect(getUserToken).toHaveBeenCalled();
    expect(foldersCore.getFoldersCore).toHaveBeenCalledWith(TOKEN_MOCK, 'public/');
    expect(result).toEqual([{ name: 'sub' }]);
  });

  test('getFolders returns an empty array when there is no merged tree', async () => {
    (foldersCore.getFoldersCore as any).mockResolvedValue(null);

    const result = await getFolders('public/missing/');

    expect(result).toEqual([]);
  });

  test('Should call getRules action', async () => {
    (foldersCore.getRulesCore as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getRules('path');
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersCore.getRulesCore).toHaveBeenCalledWith(TOKEN_MOCK, 'path');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateRules action', async () => {
    (foldersCore.updateRulesCore as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await updateRules('folder', []);
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersCore.updateRulesCore).toHaveBeenCalledWith(TOKEN_MOCK, 'folder', []);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call previewAppZip action', async () => {
    (foldersApi.previewAppZipFiles as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await previewAppZip({} as FormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersApi.previewAppZipFiles).toHaveBeenCalledWith(TOKEN_MOCK, {} as FormData);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call previewToolsetZip action', async () => {
    (foldersApi.previewToolsetZipFiles as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await previewToolsetZip({} as FormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersApi.previewToolsetZipFiles).toHaveBeenCalledWith(TOKEN_MOCK, {} as FormData);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeFolder action (unpublish)', async () => {
    (foldersCore.removeFolderCore as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await removeFolder('path');
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersCore.removeFolderCore).toHaveBeenCalledWith(TOKEN_MOCK, 'path');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call changeFolder action, scoped to the single supplied resource type', async () => {
    (foldersCore.changeFolderCore as any).mockResolvedValue(RESPONSE_MOCK);
    const overwrite = false;
    const result = await changeFolder('path', 'new', ResourceType.PROMPT, overwrite);
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersCore.changeFolderCore).toHaveBeenCalledWith(
      TOKEN_MOCK,
      'path',
      'new',
      [ResourceType.PROMPT],
      overwrite,
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createFolderWithFiles action', async () => {
    (foldersApi.createFolder as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await createFolderWithFiles({} as FormData, 'type', ApplicationRoute.Prompts);
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersApi.createFolder).toHaveBeenCalledWith(TOKEN_MOCK, {} as FormData, 'type', ApplicationRoute.Prompts);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
