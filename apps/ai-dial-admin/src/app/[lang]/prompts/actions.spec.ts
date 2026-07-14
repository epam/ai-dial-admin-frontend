import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi } from '@/src/app/api/api';
import * as eximModule from '@/src/server/prompts/exim';
import * as zipEximModule from '@/src/server/prompts/zip-exim';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ImportFileType } from '@/src/types/import';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeletePrompts,
  removePrompt,
  movePrompts,
  createPrompt,
  exportPrompts,
  getPrompt,
  getPrompts,
  importPrompts,
  updatePrompt,
} from './actions';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ResourceType } from '@/src/types/resource-type';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/prompts/exim');
vi.mock('@/src/server/prompts/zip-exim');

describe('Assets Prompt :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getPrompts action', async () => {
    (assetApi.list as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getPrompts('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.list).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getPrompt action', async () => {
    (assetApi.getMergedWithEtag as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getPrompt('path', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.getMergedWithEtag).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, 'path', 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createPrompt action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createPrompt({
      name: 'test',
      folderId: 'public/',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
      content: 'test',
    });
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, 'public/test__1.0', {
      name: 'test',
      folderId: 'public/',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
      content: 'test',
    });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('createPrompt defaults content to an empty string when omitted', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    await createPrompt({
      name: 'test',
      folderId: 'public/',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
    } as any);

    const [, , , body] = (assetApi.put as any).mock.calls[0];
    expect(body.content).toBe('');
  });

  test('createPrompt conflict surfaces a recognizable error', async () => {
    (assetApi.put as any).mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'Prompt already exists',
      status: 412,
    });

    const result = await createPrompt({
      name: 'test',
      folderId: 'public/',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
      content: 'test',
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Prompt already exists');
  });

  test('Should call removePrompt action', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    await removePrompt('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, 'test', undefined);
  });

  test('removePrompt with a concrete etag sends it through', async () => {
    (assetApi.delete as any).mockResolvedValue(RESPONSE_MOCK);

    await removePrompt('test', 'etag-1');

    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, 'test', 'etag-1');
  });

  test('Should call exportPrompts action for JSON export', async () => {
    (eximModule.buildPromptsExport as any).mockResolvedValue({ prompts: [] });

    const result = await exportPrompts(['test']);
    expect(getUserToken).toHaveBeenCalled();
    expect(eximModule.buildPromptsExport).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, ['test']);
    expect(zipEximModule.buildPromptsZip).not.toHaveBeenCalled();
    expect(result).toEqual({ prompts: [] });
  });

  test('exportPrompts wraps the document as a zip for archive export', async () => {
    (eximModule.buildPromptsExport as any).mockResolvedValue({ prompts: [] });
    const blob = new Blob(['zip']);
    (zipEximModule.buildPromptsZip as any).mockResolvedValue(blob);

    const result = await exportPrompts(['test'], ImportFileType.ARCHIVE);

    expect(zipEximModule.buildPromptsZip).toHaveBeenCalledWith({ prompts: [] });
    expect(result).toEqual({ blob, fileName: 'prompts-export.zip' });
  });

  test('importPrompts parses the JSON body and delegates to importPromptsExport', async () => {
    (eximModule.importPromptsExport as any).mockResolvedValue({ importResults: [{ status: 'success' }] });

    const document = { prompts: [{ id: 'prompts/public/name__1.0' }] };
    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'override' })]));
    body.append('file', new Blob([JSON.stringify(document)]));

    const result = await importPrompts(body, ImportFileType.JSON);

    expect(eximModule.importPromptsExport).toHaveBeenCalledWith(assetApi, TOKEN_MOCK, document, {
      path: 'public/',
      conflictResolutionStrategy: 'override',
      flatImport: undefined,
    });
    expect(result).toEqual({ success: true, response: { importResults: [{ status: 'success' }] } });
  });

  test('importPrompts extracts a zip archive before delegating', async () => {
    (zipEximModule.extractPromptsFromZip as any).mockResolvedValue({ prompts: [] });
    (eximModule.importPromptsExport as any).mockResolvedValue({ importResults: [] });

    const body = new FormData();
    body.append('config', new Blob([JSON.stringify({ path: 'public/', conflictResolutionStrategy: 'skip' })]));
    body.append('file', new Blob(['zip-bytes']));

    const result = await importPrompts(body, ImportFileType.ARCHIVE);

    expect(zipEximModule.extractPromptsFromZip).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  test('importPrompts rejects when the config part is missing', async () => {
    const result = await importPrompts(new FormData(), ImportFileType.JSON);

    expect(result.success).toBe(false);
  });

  test('Should call updatePrompt action', async () => {
    (assetApi.put as any).mockResolvedValue(RESPONSE_MOCK);

    const prompt = {
      folderId: 'public/',
      nodeType: DialFileNodeType.FOLDER,
      path: 'test',
      version: '1.0',
      content: 'content',
    };
    const result = await updatePrompt(prompt as any, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.put).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, 'test', prompt, { etag: 'etag' });
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call movePrompts action', async () => {
    (assetApi.move as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await movePrompts(['folder/path'], 'newFolder/');
    expect(getUserToken).toHaveBeenCalled();
    // changePath (unchanged, per design D4) concatenates `${newPath}/${fileName}` regardless of
    // whether newPath already ends in a slash — this double-slash quirk is existing behavior.
    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.PROMPT,
      'folder/path',
      'newFolder//path',
      undefined,
    );
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('movePrompts with duplicateName keeps the source version suffix on the destination', async () => {
    (assetApi.move as any).mockResolvedValue(RESPONSE_MOCK);

    await movePrompts(['folder/name__2'], 'folder/', false, 'copy');

    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.PROMPT,
      'folder/name__2',
      'folder//copy__2',
      false,
    );
  });

  test('Should call bulkDeletePrompts action', async () => {
    (assetApi.delete as any).mockResolvedValue({ success: true });

    const result = await bulkDeletePrompts([{ path: 'path' }]);
    expect(getUserToken).toHaveBeenCalled();
    expect(assetApi.delete).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, 'path');
    expect(result).toEqual({ success: true });
  });

  test('bulkDeletePrompts stops at the first failure (fail-fast)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    (assetApi.delete as any).mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true });

    const result = await bulkDeletePrompts([{ path: 'a' }, { path: 'b' }]);

    expect(assetApi.delete).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });
});
