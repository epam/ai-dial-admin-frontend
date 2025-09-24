import { DialAssetApp } from '@/src/models/dial/asset-app';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/folder';
import { ImportFileType } from '@/src/types/import';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { AssetsApi, ResourceBasePaths } from '../assets-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();
describe('PromptsApi', () => {
  const instance = new AssetsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getPromptsList and returns prompts', async () => {
    const mockPrompts: DialPrompt[] = [{ id: '1', name: 'Test', content: '', folderId: 'root' } as DialPrompt];

    fetchMock.mockResponseOnce(JSON.stringify({ items: mockPrompts }));

    await instance.getAssetList(TOKEN_MOCK, '/prompts', ResourceType.PROMPT);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.PROMPT]}/list`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/prompts' }),
      }),
    );
  });

  test('Should calls removePrompt and calls POST and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeAsset(TOKEN_MOCK, '/prompts/sample.json', ResourceType.PROMPT);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.PROMPT]}/delete`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/prompts/sample.json' }),
      }),
    );
  });

  test('Should calls movePrompts and sends POST requests per file and returns responses', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponse(JSON.stringify(mockResponse));

    const paths = ['/old/prompt1', '/old/prompt2'];
    await instance.moveAssets(TOKEN_MOCK, paths, '/new', ResourceType.PROMPT);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('Should calls bulkDeletePrompts and sends POST request and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponse(JSON.stringify(mockResponse));

    const paths = [{ path: '/old/prompt1' }, { path: '/old/prompt2' }];
    await instance.bulkDeleteAssets(TOKEN_MOCK, paths, ResourceType.PROMPT);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.PROMPT]}/delete/bulk`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ paths: [{ path: '/old/prompt1' }, { path: '/old/prompt2' }] }),
      }),
    );
  });
});

describe('FilesApi', () => {
  const instance = new AssetsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getFilesList and returns list of files', async () => {
    const mockFiles: DialFile[] = [{ name: 'file1' }, { name: 'file2' }] as DialFile[];

    fetchMock.mockResponseOnce(JSON.stringify({ items: mockFiles }));

    await instance.getAssetList(TOKEN_MOCK, '/mock-path', ResourceType.FILE);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(ResourceBasePaths[ResourceType.FILE]),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/mock-path' }),
      }),
    );
  });

  test('Should calls removeFile and sends DELETE request and returns ServerActionResponse', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeAsset(TOKEN_MOCK, '/test-file.txt', ResourceType.FILE);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`${ResourceBasePaths[ResourceType.FILE]}?path=/test-file.txt`),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should calls moveFiles and sends POST requests and returns ServerActionResponses', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponse(JSON.stringify(mockResponse));

    const paths = ['/old/file1.txt', '/old/file2.txt'];
    await instance.moveAssets(TOKEN_MOCK, paths, '/new', ResourceType.FILE);

    expect(fetchMock).toHaveBeenCalledTimes(paths.length);
  });

  test('importFiles calls postFiles with FILE_IMPORT_ZIP_URL for ARCHIVE', async () => {
    fetchMock.mockResponse({});
    const formData = new FormData();

    await instance.importAssets(TOKEN_MOCK, formData, ImportFileType.ARCHIVE, ResourceType.FILE);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.FILE]}/import/zip`,
      expect.objectContaining({
        method: 'POST',
        body: formData,
      }),
    );
  });

  test('importFiles calls postFiles with FILE_IMPORT_URL for non-ARCHIVE', async () => {
    fetchMock.mockResponse({});
    const formData = new FormData();
    await instance.importAssets(TOKEN_MOCK, formData, ImportFileType.FILES, ResourceType.FILE);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.FILE]}/import`,
      expect.objectContaining({
        method: 'POST',
        body: formData,
      }),
    );
  });
});

describe('AssetAppsApi', () => {
  const instance = new AssetsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getAppsList and returns prompts', async () => {
    const mockPrompts: DialAssetApp[] = [{ id: '1', name: 'Test' } as DialAssetApp];

    fetchMock.mockResponseOnce(JSON.stringify({ items: mockPrompts }));

    await instance.getAssetList(TOKEN_MOCK, '/apps', ResourceType.APPLICATION);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.APPLICATION]}/list`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/apps' }),
      }),
    );
  });

  test('Should calls removeApp and calls POST and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    await instance.removeAsset(TOKEN_MOCK, '/apps/someApp', ResourceType.APPLICATION);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.APPLICATION]}/delete`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/apps/someApp' }),
      }),
    );
  });

  test('Should calls moveApps and sends POST requests per file and returns responses', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponse(JSON.stringify(mockResponse));

    const paths = ['/old/app1', '/old/app2'];
    await instance.moveAssets(TOKEN_MOCK, paths, '/new', ResourceType.APPLICATION);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('Should calls bulkDeleteApps and sends POST request and returns response', async () => {
    const mockResponse: ServerActionResponse = { success: true };
    fetchMock.mockResponse(JSON.stringify(mockResponse));

    const paths = [{ path: '/old/app1' }, { path: '/old/app2' }];
    await instance.bulkDeleteAssets(TOKEN_MOCK, paths, ResourceType.APPLICATION);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.APPLICATION]}/delete/bulk`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ paths: [{ path: '/old/app1' }, { path: '/old/app2' }] }),
      }),
    );
  });
});
