import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { ServerActionResponse } from '@/src/models/server-action';
import {
  FOLDER_CREATE_URL,
  FOLDERS_MOVE_URL,
  FOLDERS_URL,
  FoldersApi,
  PREVIEW_APP_ZIP,
  PREVIEW_PROMPT_ZIP,
  PREVIEW_TOOLSET_ZIP,
  RULES_UPDATE_URL,
} from '@/src/server/entities/assets/folders-api';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { ResourceBasePaths, ResourceOperation } from '../constants';
import { ResourceType } from '@/src/types/resource-type';

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

  test('calls postFiles with ZIP url if type is ARCHIVE', async () => {
    fetchMock.mockResponseOnce({});

    const formData = new FormData();

    await instance.createFolder(TOKEN_MOCK, formData, ImportFileType.ARCHIVE, ApplicationRoute.Prompts);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.PROMPT]}/${ResourceOperation.IMPORT_ZIP}`,
      expect.objectContaining({
        method: 'POST',
        body: formData,
      }),
    );
  });

  test('calls postFiles with JSON url if type is not ARCHIVE', async () => {
    fetchMock.mockResponseOnce({});

    const formData = new FormData();

    await instance.createFolder(TOKEN_MOCK, formData, ImportFileType.FILES, ApplicationRoute.Prompts);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.PROMPT]}/${ResourceOperation.IMPORT_JSON}`,
      expect.objectContaining({
        method: 'POST',
        body: formData,
      }),
    );
  });

  test('calls postFiles with ZIP url if type is ARCHIVE', async () => {
    fetchMock.mockResponseOnce({});

    const formData = new FormData();

    await instance.createFolder(TOKEN_MOCK, formData, ImportFileType.ARCHIVE, ApplicationRoute.Files);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.FILE]}/${ResourceOperation.IMPORT_ZIP}`,
      expect.objectContaining({
        method: 'POST',
        body: formData,
      }),
    );
  });

  test('calls postFiles with IMPORT url if type is not ARCHIVE', async () => {
    fetchMock.mockResponseOnce({});

    const formData = new FormData();

    await instance.createFolder(TOKEN_MOCK, formData, ImportFileType.FILES, ApplicationRoute.Files);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.FILE]}/${ResourceOperation.IMPORT}`,
      expect.objectContaining({
        method: 'POST',
        body: formData,
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

  test('Should calls previewAppZipFiles and posts body and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.previewAppZipFiles(TOKEN_MOCK, {});

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${PREVIEW_APP_ZIP}`,
      expect.objectContaining({
        method: 'POST',
        body: {},
      }),
    );
  });

  test('Should calls previewToolsetZipFiles and posts body and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.previewToolsetZipFiles(TOKEN_MOCK, {});

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${PREVIEW_TOOLSET_ZIP}`,
      expect.objectContaining({
        method: 'POST',
        body: {},
      }),
    );
  });

  test('Should calls deleteFolder and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.deleteFolder(TOKEN_MOCK, 'path');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${FOLDERS_URL}?path=path`,
      expect.objectContaining({
        method: 'DELETE',
        body: undefined,
      }),
    );
  });

  test('Should calls changeFolder and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.changeFolder(TOKEN_MOCK, 'oldPath', 'newPath', 'prompt');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${FOLDERS_MOVE_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          oldPath: 'oldPath',
          newPath: 'newPath',
          resourceTypes: ['prompt'],
        }),
      }),
    );
  });
});
