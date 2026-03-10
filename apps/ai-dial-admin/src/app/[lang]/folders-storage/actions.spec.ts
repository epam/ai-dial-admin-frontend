import { beforeEach, describe, expect, test, vi } from 'vitest';

import { foldersApi } from '@/src/app/api/api';
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
  previewPromptZip,
  previewToolsetZip,
  removeFolder,
  updateRules,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Folders storage :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getFolders action', async () => {
    (foldersApi.getFolders as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getFolders('path');
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersApi.getFolders).toHaveBeenCalledWith(TOKEN_MOCK, 'path');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getRules action', async () => {
    (foldersApi.getRules as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getRules('path');
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersApi.getRules).toHaveBeenCalledWith(TOKEN_MOCK, 'path');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateRules action', async () => {
    (foldersApi.updateRules as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await updateRules('folder', []);
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersApi.updateRules).toHaveBeenCalledWith(TOKEN_MOCK, 'folder', []);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call previewPromptZip action', async () => {
    (foldersApi.previewPromptZipFiles as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await previewPromptZip({} as FormData);
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersApi.previewPromptZipFiles).toHaveBeenCalledWith(TOKEN_MOCK, {} as FormData);
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

  test('Should call deleteFolder action', async () => {
    (foldersApi.deleteFolder as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await removeFolder('path');
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersApi.deleteFolder).toHaveBeenCalledWith(TOKEN_MOCK, 'path');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call changeFolder action', async () => {
    (foldersApi.changeFolder as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await changeFolder('path', 'new', ResourceType.PROMPT);
    expect(getUserToken).toHaveBeenCalled();
    expect(foldersApi.changeFolder).toHaveBeenCalledWith(TOKEN_MOCK, 'path', 'new', ResourceType.PROMPT);
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
