import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, assetsApi, toolsetOpsApi } from '@/src/app/api/api';
import * as eximModule from '@/src/server/toolsets/exim';
import * as mcpClientModule from '@/src/server/toolsets/mcp-client';
import * as zipEximModule from '@/src/server/toolsets/zip-exim';
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
vi.mock('@/src/server/toolsets/exim');
vi.mock('@/src/server/toolsets/mcp-client');
vi.mock('@/src/server/toolsets/zip-exim');

describe('Assets Toolset :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getToolsets action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getToolsets('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TOOLSET, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getToolset action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getToolset('path', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TOOLSET, 'path', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateToolset action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

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
    expect(assetApi.put).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.TOOLSET,
      'test',
      {
        folderId: undefined,
        nodeType: DialFileNodeType.FOLDER,
        path: undefined,
        version: undefined,
        displayVersion: '1.0',
      },
      { etag: 'etag' },
    );
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('updateToolset without a concrete etag still passes it through', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await updateToolset(
      { folderId: 'public', nodeType: DialFileNodeType.FOLDER, path: 'test', version: '1.0' },
      undefined as any,
    );

    const [, , , , options] = (assetApi.put as any).mock.calls[0];
    expect(options).toEqual({ etag: undefined });
  });

  test('Should call createToolset action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createToolset({
      folderId: 'public',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
    });
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TOOLSET, 'public__1.0', {
      folderId: undefined,
      nodeType: DialFileNodeType.FOLDER,
      path: undefined,
      version: undefined,
      allowedTools: void 0,
      transport: 'SSE',
      displayVersion: '1.0',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createToolset conflict surfaces a recognizable error', async () => {
    (assetApi.put as any).mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'Toolset already exists',
    });

    const result = await createToolset({
      folderId: 'public',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Toolset already exists');
  });

  test('Should call removeToolset action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeToolset('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TOOLSET, 'test', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('removeToolset without an etag calls the Core client unconditionally', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    await removeToolset('test');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TOOLSET, 'test', undefined);
  });

  test('Should call moveToolsets action', async () => {
    (assetApi.move as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await moveToolsets(['folder/path'], 'newFolder/');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.TOOLSET,
      'folder/path',
      'newFolder//path',
      undefined,
    );
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('moveToolsets with duplicateName keeps the source version suffix on the destination', async () => {
    (assetApi.move as any).mockResolvedValue(RESPONSE_MOCK);

    await moveToolsets(['folder/name__2'], 'folder/', false, 'copy');

    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.TOOLSET,
      'folder/name__2',
      'folder//copy__2',
      false,
    );
  });

  test('Should call bulkDeleteToolsets action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteToolsets([{ path: 'path' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.TOOLSET, 'path');
    expect(result).toEqual({ success: true });
  });

  test('bulkDeleteToolsets stops at the first failure (fail-fast)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    (assetApi.delete as any).mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true });

    const result = await bulkDeleteToolsets([{ path: 'a' }, { path: 'b' }]);

    expect(assetApi.delete).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });

  test('Should call getAssetTools action', async () => {
    (toolsetOpsApi.discoveredTools as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getAssetTools('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(toolsetOpsApi.discoveredTools).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call exportToolsets action for JSON export', async () => {
    (eximModule.buildToolsetsExport as any).mockResolvedValue({ toolSets: [] });

    const result = await exportToolsets(['test']);
    expect(getUserToken).toHaveBeenCalled();
    expect(eximModule.buildToolsetsExport).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, ['test']);
    expect(zipEximModule.buildToolsetsZip).not.toHaveBeenCalled();
    expect(result).toEqual({ toolSets: [] });
  });

  test('exportToolsets wraps the document as a zip for archive export', async () => {
    (eximModule.buildToolsetsExport as any).mockResolvedValue({ toolSets: [] });
    const blob = new Blob(['zip']);
    (zipEximModule.buildToolsetsZip as any).mockResolvedValue(blob);

    const result = await exportToolsets(['test'], ImportFileType.ARCHIVE);

    expect(zipEximModule.buildToolsetsZip).toHaveBeenCalledWith({ toolSets: [] });
    expect(result).toEqual({ blob, fileName: 'toolsets-export.zip' });
  });

  test('Should call signInToolset action', async () => {
    (toolsetOpsApi.signIn as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await signInToolset(
      { path: 'path', folderId: 'test', nodeType: DialFileNodeType.FOLDER, version: '1.0' },
      ToolsetAuthCredentialLevel.GLOBAL,
      'https://redirect.example.com/callback',
      'key',
      'code',
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(toolsetOpsApi.signIn).toHaveBeenCalledWith(TOKEN_MOCK, {
      url: 'toolsets/path',
      credentialsLevel: ToolsetAuthCredentialLevel.GLOBAL,
      authenticationType: undefined,
      apiKey: 'key',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call signOutToolset action', async () => {
    (toolsetOpsApi.signOut as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await signOutToolset(
      { path: 'path', folderId: 'test', nodeType: DialFileNodeType.FOLDER, version: '1.0' },
      ToolsetAuthCredentialLevel.GLOBAL,
    );
    expect(getUserToken).toHaveBeenCalled();
    expect(toolsetOpsApi.signOut).toHaveBeenCalledWith(TOKEN_MOCK, {
      url: 'toolsets/path',
      credentialsLevel: ToolsetAuthCredentialLevel.GLOBAL,
      authenticationType: undefined,
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('importToolsets parses the JSON body and delegates to importToolsetsExport', async () => {
    (eximModule.importToolsetsExport as any).mockResolvedValue({ importResults: [{ status: 'success' }] });

    const document = { toolSets: [{ id: 'toolsets/public/name__1.0' }] };
    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'override' })]));
    body.append('file', new Blob([JSON.stringify(document)]));

    const result = await importToolsets(body, ImportFileType.JSON);

    expect(eximModule.importToolsetsExport).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, document, {
      path: 'public/',
      conflictResolutionStrategy: 'override',
      flatImport: undefined,
    });
    expect(result).toEqual({ success: true, response: { importResults: [{ status: 'success' }] } });
  });

  test('importToolsets extracts a zip archive before delegating', async () => {
    (zipEximModule.extractToolsetsFromZip as any).mockResolvedValue({ toolSets: [] });
    (eximModule.importToolsetsExport as any).mockResolvedValue({ importResults: [] });

    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'skip' })]));
    body.append('file', new Blob(['zip-bytes']));

    const result = await importToolsets(body, ImportFileType.ARCHIVE);

    expect(zipEximModule.extractToolsetsFromZip).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  test('importToolsets rejects when the config part is missing', async () => {
    const result = await importToolsets(new FormData(), ImportFileType.JSON);

    expect(result.success).toBe(false);
  });

  test('Should call tryOutAssetTool action for TOOLSET via the MCP client', async () => {
    (mcpClientModule.callToolViaMcp as any).mockResolvedValue(RESPONSE_MOCK);

    const callToolRequest = { name: 'tool', arguments: {} };
    const result = await tryOutAssetTool({ toolSetPath: { path: 'public/name__1.0' }, callToolRequest });

    expect(getUserToken).toHaveBeenCalled();
    expect(mcpClientModule.callToolViaMcp).toHaveBeenCalledWith(
      expect.any(String),
      TOKEN_MOCK,
      'public/name__1.0',
      callToolRequest,
    );
    expect(assetsApi.tryOutTool).not.toHaveBeenCalled();
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call tryOutAssetTool action for APPLICATION resource type', async () => {
    (assetsApi.tryOutTool as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await tryOutAssetTool({}, ResourceType.APPLICATION);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetsApi.tryOutTool).toHaveBeenCalledWith({}, TOKEN_MOCK, ResourceType.APPLICATION);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
