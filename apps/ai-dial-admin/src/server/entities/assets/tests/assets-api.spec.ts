import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { RESPONSE_MOCK, TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { AssetsApi } from '../assets-api';
import { ResourceBasePaths } from '../constants';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('PromptsApi', () => {
  const instance = new AssetsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getPromptsList', async () => {
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

  test('Should calls removePrompt', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeAsset(TOKEN_MOCK, '/prompts/sample.json', ResourceType.PROMPT);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.PROMPT]}/delete`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/prompts/sample.json' }),
      }),
    );
  });

  test('Should calls movePrompts', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const paths = ['/old/prompt1', '/old/prompt2'];
    await instance.moveAssets(TOKEN_MOCK, paths, '/new', ResourceType.PROMPT);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('Should calls bulkDeletePrompts', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

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

  test('importPrompts calls postFiles with FILE_IMPORT_URL for non-ARCHIVE', async () => {
    fetchMock.mockResponseOnce({});
    const formData = new FormData();
    await instance.importAssets(TOKEN_MOCK, formData, ImportFileType.FILES, ResourceType.PROMPT);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.PROMPT]}/import/json`,
      expect.objectContaining({
        method: 'POST',
        body: formData,
      }),
    );
  });

  test('Should calls exportAssets', async () => {
    fetchMock.mockResponseOnce({});
    await instance.exportAssets(TOKEN_MOCK, ResourceType.APPLICATION, ['test'], ImportFileType.FILES);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.APPLICATION]}/export/json`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ paths: ['test'] }),
      }),
    );
  });

  test('Should calls exportAssets', async () => {
    fetchMock.mockResponseOnce({});
    await instance.exportAssets(TOKEN_MOCK, ResourceType.APPLICATION, ['test'], ImportFileType.ARCHIVE);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.APPLICATION]}/export`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ paths: ['test'] }),
      }),
    );
  });
});

describe('FilesApi', () => {
  const instance = new AssetsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getFilesList', async () => {
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

  test('Should calls removeFile', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeAsset(TOKEN_MOCK, '/test-file.txt', ResourceType.FILE);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`${ResourceBasePaths[ResourceType.FILE]}?path=/test-file.txt`),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  test('Should calls moveFiles', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const paths = ['/old/file1.txt', '/old/file2.txt'];
    await instance.moveAssets(TOKEN_MOCK, paths, '/new', ResourceType.FILE);

    expect(fetchMock).toHaveBeenCalledTimes(paths.length);
  });

  test('Should calls previewFile', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    await instance.previewFile(TOKEN_MOCK, 'test');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`${ResourceBasePaths[ResourceType.FILE]}/download?path=test`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls downloadFile', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    await instance.downloadFile(TOKEN_MOCK, 'test');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`${ResourceBasePaths[ResourceType.FILE]}/download?path=test`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('Should calls exportFiles', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));
    await instance.exportFiles(TOKEN_MOCK, ['test']);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`${ResourceBasePaths[ResourceType.FILE]}/export`),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  test('importFiles calls postFiles with FILE_IMPORT_ZIP_URL for ARCHIVE', async () => {
    fetchMock.mockResponseOnce({});
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
    fetchMock.mockResponseOnce({});
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

  test('Should calls getAppsList', async () => {
    const mockApps: Asset[] = [{ id: '1', name: 'Test' } as Asset];

    fetchMock.mockResponseOnce(JSON.stringify({ items: mockApps }));

    await instance.getAssetList(TOKEN_MOCK, '/apps', ResourceType.APPLICATION);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.APPLICATION]}/list`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/apps' }),
      }),
    );
  });

  test('Should calls removeApp', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeAsset(TOKEN_MOCK, '/apps/someApp', ResourceType.APPLICATION);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.APPLICATION]}/delete`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/apps/someApp' }),
      }),
    );
  });

  test('Should calls moveApps', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    const paths = ['/old/app1', '/old/app2'];
    await instance.moveAssets(TOKEN_MOCK, paths, '/new', ResourceType.APPLICATION);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('Should calls bulkDeleteApps', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

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

describe('Toolset', () => {
  const instance = new AssetsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should calls getTools ', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getTools('path', TOKEN_MOCK);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/discovered-tools`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: 'path' }),
      }),
    );
  });

  test('Should calls getTools for app ', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getTools('path', TOKEN_MOCK, ResourceType.APPLICATION);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.APPLICATION]}/discovered-tools`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: 'path' }),
      }),
    );
  });

  test('Should calls signInToolset ', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.signInToolset(
      { path: 'path', folderId: 'test', nodeType: DialFileNodeType.FOLDER, version: '1.0' },
      ToolsetAuthCredentialLevel.GLOBAL,
      TOKEN_MOCK,
      'https://redirect.example.com/callback',
      'key',
      'code',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/sign-in`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          url: 'toolsets/path',
          credentialsLevel: ToolsetAuthCredentialLevel.GLOBAL,
          apiKey: 'key',
        }),
      }),
    );
  });

  test('Should calls signOutToolset ', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.signOutToolset(
      { path: 'path', folderId: 'test', nodeType: DialFileNodeType.FOLDER, version: '1.0' },
      ToolsetAuthCredentialLevel.GLOBAL,
      TOKEN_MOCK,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/sign-out`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ url: 'toolsets/path', credentialsLevel: ToolsetAuthCredentialLevel.GLOBAL }),
      }),
    );
  });

  test('Should calls removeAssetWithEtag', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeAssetWithEtag(TOKEN_MOCK, '/sample.json', ResourceType.TOOLSET, 'etag');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/delete`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/sample.json' }),
      }),
    );
  });

  test('Should calls removeAssetWithEtag', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.removeAssetWithEtag(TOKEN_MOCK, '/sample.json', ResourceType.TOOLSET);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/delete`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/sample.json' }),
      }),
    );
  });

  test('Should calls createAsset', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.createAsset({ path: '/sample.json', content: 'content' } as any, ResourceType.TOOLSET, TOKEN_MOCK);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/create`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/sample.json', content: 'content', folderId: 'public' }),
      }),
    );
  });

  test('Should calls updateAssetWithEtag', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateAssetWithEtag(
      TOKEN_MOCK,
      { path: '/sample.json', content: 'content' } as any,
      ResourceType.TOOLSET,
      'etag',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/update`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/sample.json', content: 'content' }),
      }),
    );
  });

  test('Should calls updateAsset', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.updateAsset(TOKEN_MOCK, { path: '/sample.json', content: 'content' } as any, ResourceType.TOOLSET);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/update`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: '/sample.json', content: 'content' }),
      }),
    );
  });

  test('Should calls getAssetWithEtag', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getAssetWithEtag(TOKEN_MOCK, 'test' as any, ResourceType.TOOLSET, 'etag');

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/get`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: 'test' }),
      }),
    );
  });

  test('Should calls getAsset', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.getAsset(TOKEN_MOCK, 'test' as any, ResourceType.TOOLSET);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/get`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: 'test' }),
      }),
    );
  });

  test('Should call tryOutTool', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(RESPONSE_MOCK));

    await instance.tryOutTool({ path: 'test' }, TOKEN_MOCK);

    expect(fetchMock).toHaveBeenCalledWith(
      `${TEST_URL}${ResourceBasePaths[ResourceType.TOOLSET]}/call-tool`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ path: 'test' }),
      }),
    );
  });
});
