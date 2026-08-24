import { beforeEach, describe, expect, test, vi } from 'vitest';

import { assetApi, filesCoreApi, publicationsApi, skillsCoreApi } from '@/src/app/api/api';
import { ResourceType } from '@/src/types/resource-type';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  changeFolderCore,
  getFoldersCore,
  getRulesCore,
  removeFolderCore,
  removeSkillFolderCore,
  updateRulesCore,
} from '../folders-core';

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

  test('updateRulesCore encodes a targetFolder containing spaces before creating the publication', async () => {
    (publicationsApi.createPublication as any).mockResolvedValue({
      success: true,
      response: { url: 'publications/public/y%20o2/' },
    });
    (publicationsApi.approvePublication as any).mockResolvedValue({ success: true });

    await updateRulesCore(TOKEN_MOCK, 'public/y o2/', []);

    expect(publicationsApi.createPublication).toHaveBeenCalledWith(TOKEN_MOCK, 'public/y%20o2/', [], []);
  });
});

describe('Server :: Folders :: folders-core :: removeFolderCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('gathers resources only across the targeted types, publishes+approves, and best-effort cleans up', async () => {
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

    const result = await removeFolderCore(TOKEN_MOCK, 'public/', [ResourceType.PROMPT]);

    expect(publicationsApi.createPublication).toHaveBeenCalledWith(
      TOKEN_MOCK,
      'public/',
      [{ action: 'DELETE', targetUrl: 'prompts/public/a__1' }],
      undefined,
    );
    expect(assetApi.getMetadata).not.toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      expect.anything(),
      expect.anything(),
    );
    expect(result.success).toBe(true);
  });

  test('fails overall if the publish step itself fails', async () => {
    (assetApi.getMetadata as any).mockResolvedValue(null);
    (filesCoreApi.getFileMetadata as any).mockResolvedValue(null);
    (publicationsApi.createPublication as any).mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await removeFolderCore(TOKEN_MOCK, 'public/', [ResourceType.PROMPT]);

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

  test('renaming a folder with contents does not glue the folder name onto the contained resource name', async () => {
    (assetApi.getMetadata as any).mockImplementation(
      (_t: unknown, _type: unknown, path: string, options: { recursive?: boolean }) =>
        options?.recursive
          ? Promise.resolve(
              folderNode('applications/als_code_apps/', [itemNode('applications/als_code_apps/als-quickapp20')]),
            )
          : Promise.resolve(folderNode('applications/als_code_apps/')),
    );
    (publicationsApi.ruleList as any).mockResolvedValue({ success: true, response: { rules: {} } });
    (assetApi.move as any).mockResolvedValue({ success: true });

    const result = await changeFolderCore(TOKEN_MOCK, 'als_code_apps/', 'renamed_apps/', [ResourceType.APPLICATION]);

    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.APPLICATION,
      'als_code_apps/als-quickapp20',
      'renamed_apps/als-quickapp20',
      false,
    );
    expect(result.success).toBe(true);
  });

  test('computes correct destination paths when oldPath/newPath are passed without a trailing slash', async () => {
    (assetApi.getMetadata as any).mockImplementation(
      (_t: unknown, _type: unknown, path: string, options: { recursive?: boolean }) =>
        options?.recursive
          ? Promise.resolve(folderNode('prompts/old/', [itemNode('prompts/old/a__1')]))
          : Promise.resolve(folderNode('prompts/old/')),
    );
    (publicationsApi.ruleList as any).mockResolvedValue({ success: true, response: { rules: {} } });
    (assetApi.move as any).mockResolvedValue({ success: true });

    const result = await changeFolderCore(TOKEN_MOCK, 'old', 'new', [ResourceType.PROMPT]);

    expect(assetApi.move).toHaveBeenCalledWith(TOKEN_MOCK, ResourceType.PROMPT, 'old/a__1', 'new/a__1', false);
    expect(result.success).toBe(true);
  });

  test('moving a folder represented only by its .dial_folder marker keeps the marker nested under the destination folder', async () => {
    (assetApi.getMetadata as any).mockImplementation(
      (_t: unknown, _type: unknown, path: string, options: { recursive?: boolean }) =>
        options?.recursive
          ? Promise.resolve(folderNode('prompts/old/', [itemNode('prompts/old/.dial_folder')]))
          : Promise.resolve(folderNode('prompts/old/')),
    );
    (publicationsApi.ruleList as any).mockResolvedValue({ success: true, response: { rules: {} } });
    (assetApi.move as any).mockResolvedValue({ success: true });

    const result = await changeFolderCore(TOKEN_MOCK, 'old/', 'parent/new/', [ResourceType.PROMPT]);

    expect(assetApi.move).toHaveBeenCalledWith(
      TOKEN_MOCK,
      ResourceType.PROMPT,
      'old/.dial_folder',
      'parent/new/.dial_folder',
      false,
    );
    expect(result.success).toBe(true);
  });

  test('fails the move instead of silently misplacing a descendant whose path does not start with oldPath', async () => {
    (assetApi.getMetadata as any).mockImplementation(
      (_t: unknown, _type: unknown, path: string, options: { recursive?: boolean }) =>
        options?.recursive
          ? Promise.resolve(folderNode('prompts/old/', [itemNode('prompts/unrelated/a__1')]))
          : Promise.resolve(folderNode('prompts/old/')),
    );
    (publicationsApi.ruleList as any).mockResolvedValue({ success: true, response: { rules: {} } });

    const result = await changeFolderCore(TOKEN_MOCK, 'old/', 'new/', [ResourceType.PROMPT]);

    expect(assetApi.move).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});

describe('Server :: Folders :: folders-core :: removeSkillFolderCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('deletes every skill, then every nested folder marker deepest-first, then the target folder, all unconditionally', async () => {
    (skillsCoreApi.listSkillMetadata as any).mockImplementation((_t: unknown, path: string) => {
      if (path === 'public/target/') {
        return Promise.resolve({
          items: [
            { url: 'skills/public/target/a', nodeType: 'ITEM' },
            { url: 'skills/public/target/sub', nodeType: 'FOLDER' },
          ],
        });
      }
      if (path === 'public/target/sub/') {
        return Promise.resolve({ items: [{ url: 'skills/public/target/sub/b', nodeType: 'ITEM' }] });
      }
      return Promise.resolve({ items: [] });
    });
    (skillsCoreApi.deleteSkill as any).mockResolvedValue({ success: true });
    (skillsCoreApi.deleteSkillFolder as any).mockResolvedValue({ success: true });

    const result = await removeSkillFolderCore(TOKEN_MOCK, 'public/target/');

    expect(skillsCoreApi.deleteSkill).toHaveBeenCalledWith(TOKEN_MOCK, 'public/target/a', '*');
    expect(skillsCoreApi.deleteSkill).toHaveBeenCalledWith(TOKEN_MOCK, 'public/target/sub/b', '*');
    const folderCallPaths = (skillsCoreApi.deleteSkillFolder as any).mock.calls.map((call: unknown[]) => call[1]);
    // The nested folder keeps the trailing slash `toSkillList` now gives every folder row (matching
    // every other asset type's folder-path convention); `deleteSkillFolder` itself normalizes before
    // building the route, so this doesn't produce a `//` against Core.
    expect(folderCallPaths).toEqual(['public/target/sub/', 'public/target']);
    expect((skillsCoreApi.deleteSkillFolder as any).mock.calls[0][2]).toBe('*');
    expect(result.success).toBe(true);
  });

  test('stops at the first failed delete without attempting further deletes', async () => {
    (skillsCoreApi.listSkillMetadata as any).mockResolvedValue({
      items: [
        { url: 'skills/public/target/a', nodeType: 'ITEM' },
        { url: 'skills/public/target/b', nodeType: 'ITEM' },
      ],
    });
    (skillsCoreApi.deleteSkill as any)
      .mockResolvedValueOnce({ success: false, errorMessage: 'boom' })
      .mockResolvedValueOnce({ success: true });

    const result = await removeSkillFolderCore(TOKEN_MOCK, 'public/target/');

    expect(skillsCoreApi.deleteSkill).toHaveBeenCalledTimes(1);
    expect(skillsCoreApi.deleteSkillFolder).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  test('deletes just the target folder when it has no children', async () => {
    (skillsCoreApi.listSkillMetadata as any).mockResolvedValue({ items: [] });
    (skillsCoreApi.deleteSkillFolder as any).mockResolvedValue({ success: true });

    const result = await removeSkillFolderCore(TOKEN_MOCK, 'public/empty/');

    expect(skillsCoreApi.deleteSkill).not.toHaveBeenCalled();
    expect(skillsCoreApi.deleteSkillFolder).toHaveBeenCalledWith(TOKEN_MOCK, 'public/empty', '*');
    expect(result.success).toBe(true);
  });
});
