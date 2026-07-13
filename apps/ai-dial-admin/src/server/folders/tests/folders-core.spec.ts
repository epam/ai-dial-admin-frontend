import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, filesCoreApi, publicationsApi } from '@/src/app/api/api';
import { ResourceType } from '@/src/types/resource-type';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { changeFolderCore, getFoldersCore, getRulesCore, removeFolderCore, updateRulesCore } from '../folders-core';

vi.mock('@/src/app/api/api');

const folderNode = (url: string, items: unknown[] = []) => ({ url, nodeType: 'FOLDER', items });
const itemNode = (url: string) => ({ url, nodeType: 'ITEM' });

describe('Server :: Folders :: folders-core :: getFoldersCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('merges folder trees from every type that has this folder', async () => {
    (assetApi.getMetadata as any).mockImplementation((_t: unknown, type: ResourceType) => {
      if (type === ResourceType.PROMPT) return Promise.resolve(folderNode('prompts/public/'));
      if (type === ResourceType.APPLICATION) return Promise.resolve(folderNode('applications/public/'));
      return Promise.resolve(null);
    });
    (filesCoreApi.getFileMetadata as any).mockResolvedValue(null);

    const result = await getFoldersCore(TOKEN_MOCK, 'public/');

    expect(result).toMatchObject({ name: 'public' });
  });

  test('returns null when no type has this folder', async () => {
    (assetApi.getMetadata as any).mockResolvedValue(null);
    (filesCoreApi.getFileMetadata as any).mockResolvedValue(null);

    const result = await getFoldersCore(TOKEN_MOCK, 'public/missing/');

    expect(result).toBeNull();
  });

  test('reads one level only (recursive: false), matching the backend’s real getFolders and the old foldersApi.getFolders result', async () => {
    (assetApi.getMetadata as any).mockImplementation((_t: unknown, type: ResourceType) =>
      type === ResourceType.PROMPT ? Promise.resolve(folderNode('prompts/public/')) : Promise.resolve(null),
    );
    (filesCoreApi.getFileMetadata as any).mockResolvedValue(null);

    await getFoldersCore(TOKEN_MOCK, 'public/');

    expect(assetApi.getMetadata).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.PROMPT,
      'public/',
      expect.objectContaining({ recursive: false }),
    );
    expect(filesCoreApi.getFileMetadata).toHaveBeenCalledWith(TOKEN_MOCK, 'public/', false, undefined);
  });
});

describe('Server :: Folders :: folders-core :: getRulesCore / updateRulesCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('getRulesCore unwraps the rules map from ruleList', async () => {
    (publicationsApi.ruleList as any).mockResolvedValue({
      success: true,
      response: { rules: { 'public/': [{ source: 'title', function: 'equal', targets: ['x'] }] } },
    });

    const result = await getRulesCore(TOKEN_MOCK, 'public/');

    expect(result.success).toBe(true);
    expect(result.response).toEqual({ 'public/': [{ source: 'title', function: 'equal', targets: ['x'] }] });
  });

  test('updateRulesCore creates then approves the publication', async () => {
    (publicationsApi.createPublication as any).mockResolvedValue({
      success: true,
      response: { url: 'publications/public/' },
    });
    (publicationsApi.approvePublication as any).mockResolvedValue({ success: true });

    const result = await updateRulesCore(TOKEN_MOCK, 'public/', [
      { source: 'title', function: 'equal', targets: ['x'] },
    ] as any);

    expect(publicationsApi.createPublication).toHaveBeenCalledWith(
      TOKEN_MOCK,
      'public/',
      [],
      [{ source: 'title', function: 'equal', targets: ['x'] }],
    );
    expect(publicationsApi.approvePublication).toHaveBeenCalledWith(TOKEN_MOCK, 'public/');
    expect(result.success).toBe(true);
  });

  test('updateRulesCore stops if create fails, never calling approve', async () => {
    (publicationsApi.createPublication as any).mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await updateRulesCore(TOKEN_MOCK, 'public/', []);

    expect(publicationsApi.approvePublication).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});

describe('Server :: Folders :: folders-core :: removeFolderCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('gathers resources across types, publishes+approves, and best-effort cleans up', async () => {
    (assetApi.getMetadata as any).mockImplementation((_t: unknown, type: ResourceType) =>
      type === ResourceType.PROMPT
        ? Promise.resolve(folderNode('prompts/public/', [itemNode('prompts/public/a__1')]))
        : Promise.resolve(null),
    );
    (filesCoreApi.getFileMetadata as any).mockResolvedValue(null);
    (publicationsApi.createPublication as any).mockResolvedValue({
      success: true,
      response: { url: 'publications/public/' },
    });
    (publicationsApi.approvePublication as any).mockResolvedValue({ success: true });
    (assetApi.delete as any).mockRejectedValue(new Error('cleanup failed'));
    (filesCoreApi.deleteFile as any).mockRejectedValue(new Error('cleanup failed'));

    const result = await removeFolderCore(TOKEN_MOCK, 'public/');

    expect(publicationsApi.createPublication).toHaveBeenCalledWith(
      TOKEN_MOCK,
      'public/',
      [{ action: 'DELETE', targetUrl: 'prompts/public/a__1' }],
      undefined,
    );
    expect(result.success).toBe(true);
  });

  test('fails overall if the publish step itself fails', async () => {
    (assetApi.getMetadata as any).mockResolvedValue(null);
    (filesCoreApi.getFileMetadata as any).mockResolvedValue(null);
    (publicationsApi.createPublication as any).mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await removeFolderCore(TOKEN_MOCK, 'public/');

    expect(result.success).toBe(false);
  });
});

describe('Server :: Folders :: folders-core :: changeFolderCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('rejects the move before mutating anything if the folder is missing for a targeted type', async () => {
    (assetApi.getMetadata as any).mockResolvedValue(null);

    const result = await changeFolderCore(TOKEN_MOCK, 'old/', 'new/', [ResourceType.PROMPT]);

    expect(result.success).toBe(false);
    expect(assetApi.move).not.toHaveBeenCalled();
  });

  test('copies rules to the destination path before moving resources', async () => {
    (assetApi.getMetadata as any).mockImplementation(
      (_t: unknown, _type: unknown, path: string, options: { recursive?: boolean }) =>
        options?.recursive
          ? Promise.resolve(folderNode('prompts/old/', [itemNode('prompts/old/a__1')]))
          : Promise.resolve(folderNode('prompts/old/')),
    );
    (publicationsApi.ruleList as any).mockResolvedValue({
      success: true,
      response: { rules: { 'old/': [{ source: 'title', function: 'equal', targets: ['x'] }] } },
    });
    (publicationsApi.createPublication as any).mockResolvedValue({
      success: true,
      response: { url: 'publications/new/' },
    });
    (publicationsApi.approvePublication as any).mockResolvedValue({ success: true });
    (assetApi.move as any).mockResolvedValue({ success: true });

    const result = await changeFolderCore(TOKEN_MOCK, 'old/', 'new/', [ResourceType.PROMPT]);

    expect(publicationsApi.createPublication).toHaveBeenCalledWith(
      TOKEN_MOCK,
      'new/',
      [],
      [{ source: 'title', function: 'equal', targets: ['x'] }],
    );
    expect(assetApi.move).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, 'old/a__1', 'new/a__1', false);
    expect(result.success).toBe(true);
  });

  test('stops at the first per-type move failure without rolling back', async () => {
    (assetApi.getMetadata as any).mockImplementation(
      (_t: unknown, _type: unknown, path: string, options: { recursive?: boolean }) =>
        options?.recursive
          ? Promise.resolve(folderNode('prompts/old/', [itemNode('prompts/old/a__1'), itemNode('prompts/old/b__1')]))
          : Promise.resolve(folderNode('prompts/old/')),
    );
    (publicationsApi.ruleList as any).mockResolvedValue({ success: true, response: { rules: {} } });
    (assetApi.move as any).mockResolvedValueOnce({ success: false, errorMessage: 'conflict' });

    const result = await changeFolderCore(TOKEN_MOCK, 'old/', 'new/', [ResourceType.PROMPT]);

    expect(assetApi.move).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(false);
  });
});
