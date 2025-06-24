import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { ServerActionResponse } from '@/src/models/server-action';
import {
  FOLDER_CREATE_URL,
  FOLDERS_URL,
  FoldersApi,
  PREVIEW_PROMPT_ZIP,
  RULES_UPDATE_URL,
} from '@/src/server/entities/folders-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();
describe('Server :: FoldersApi', () => {
  const instance = new FoldersApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getFolders and returns folders list', async () => {
    const mockFolders: DialFolder[] = [{ id: 'folder1', name: 'Folder 1' } as DialFolder];
    fetchMock.mockResponse(JSON.stringify({ items: mockFolders }));

    await instance.getFolders(TOKEN_MOCK, '/some/path');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${FOLDERS_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/some/path' }),
      }),
    );
  });

  test('Should calls getRules and returns rules record', async () => {
    const mockRules: Record<string, DialRule[]> = {
      folder1: [{ id: 'rule1', name: 'Rule 1' } as DialRule],
    };
    fetchMock.mockResponseOnce(JSON.stringify(mockRules));

    await instance.getRules(TOKEN_MOCK, '/some/path');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${FOLDERS_URL}?path=/some/path`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls updateRules and posts rules update and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const rules: DialRule[] = [{ id: 'rule1', name: 'Rule 1' } as DialRule];
    await instance.updateRules(TOKEN_MOCK, '/target/folder', rules);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${RULES_UPDATE_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ targetFolder: '/target/folder', rules }),
      }),
    );
  });

  test.skip('Should calls createFolder and posts body and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.createFolder(TOKEN_MOCK, {});

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${FOLDER_CREATE_URL}`,
      expect.objectContaining({
        method: 'PUT',
        body: {},
      }),
    );
  });

  test('Should calls previewPromptZipFiles and posts body and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.previewPromptZipFiles(TOKEN_MOCK, {});

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${PREVIEW_PROMPT_ZIP}`,
      expect.objectContaining({
        method: 'POST',
        body: {},
      }),
    );
  });
});
