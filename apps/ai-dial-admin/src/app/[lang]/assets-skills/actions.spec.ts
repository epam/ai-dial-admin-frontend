import { beforeEach, describe, expect, test, vi } from 'vitest';

import { skillsCoreApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { bulkDeleteSkills, getSkill, getSkills, removeSkill, removeSkillFile, uploadSkillFile } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets Skills :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('getSkills maps a single page of folder metadata into rows, splitting nested folder from name', async () => {
    (skillsCoreApi.listSkillMetadata as any).mockResolvedValue({
      name: 'public',
      nodeType: 'FOLDER',
      items: [
        {
          name: 'my-skill',
          url: 'skills/public/nested/my-skill',
          nodeType: 'ITEM',
          author: 'a',
          updatedAt: 1,
          etag: 'etag-1',
        },
      ],
    });

    const result = await getSkills('public/nested/');

    expect(getUserToken).toHaveBeenCalled();
    expect(skillsCoreApi.listSkillMetadata).toHaveBeenCalledWith(TOKEN_MOCK, 'public/nested/', {
      nextToken: undefined,
    });
    expect(result).toEqual([
      expect.objectContaining({
        name: 'my-skill',
        folderId: 'public/nested/',
        path: 'public/nested/my-skill',
        author: 'a',
        nodeType: 'item',
        etag: 'etag-1',
      }),
    ]);
  });

  test('getSkills follows the continuation token until the folder is fully read', async () => {
    (skillsCoreApi.listSkillMetadata as any)
      .mockResolvedValueOnce({ name: 'public', nodeType: 'FOLDER', items: [], nextToken: 'page-2' })
      .mockResolvedValueOnce({ name: 'public', nodeType: 'FOLDER', items: [] });

    await getSkills('public/');

    expect(skillsCoreApi.listSkillMetadata).toHaveBeenCalledTimes(2);
    expect(skillsCoreApi.listSkillMetadata).toHaveBeenNthCalledWith(2, TOKEN_MOCK, 'public/', {
      nextToken: 'page-2',
    });
  });

  test('getSkill wraps a found skill in a successful ServerActionResponse', async () => {
    const skill = { name: 'my-skill', path: 'public/my-skill', files: [], etag: 'etag-1' };
    (skillsCoreApi.getSkillMetadata as any).mockResolvedValue(skill);

    const result = await getSkill('public/my-skill');

    expect(skillsCoreApi.getSkillMetadata).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-skill');
    expect(result).toEqual({ success: true, response: skill, etag: 'etag-1' });
  });

  test('getSkill reports not-found when the skill resource is missing', async () => {
    (skillsCoreApi.getSkillMetadata as any).mockResolvedValue(null);

    const result = await getSkill('public/missing');

    expect(result.success).toBe(false);
  });

  test('removeSkill delegates to the Core client', async () => {
    (skillsCoreApi.deleteSkill as any).mockResolvedValue({ success: true });

    const result = await removeSkill('public/my-skill', 'etag-1');

    expect(skillsCoreApi.deleteSkill).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-skill', 'etag-1');
    expect(result).toEqual({ success: true });
  });

  test('uploadSkillFile extracts the file from the FormData and delegates to the Core client', async () => {
    (skillsCoreApi.uploadSkillFile as any).mockResolvedValue({ success: true });
    const file = new File(['content'], 'notes.md');
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadSkillFile('public/my-skill', 'notes.md', formData);

    expect(skillsCoreApi.uploadSkillFile).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-skill', 'notes.md', file);
    expect(result).toEqual({ success: true });
  });

  test('uploadSkillFile rejects before calling Core when the FormData has no file', async () => {
    const result = await uploadSkillFile('public/my-skill', 'notes.md', new FormData());

    expect(result.success).toBe(false);
    expect(skillsCoreApi.uploadSkillFile).not.toHaveBeenCalled();
  });

  test('removeSkillFile delegates to the Core client, etag optional', async () => {
    (skillsCoreApi.deleteSkillFile as any).mockResolvedValue({ success: true });

    const result = await removeSkillFile('public/my-skill', 'notes.md', 'etag-1');

    expect(skillsCoreApi.deleteSkillFile).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-skill', 'notes.md', 'etag-1');
    expect(result).toEqual({ success: true });
  });

  test('bulkDeleteSkills rejects the whole batch before calling Core if any item lacks an etag', async () => {
    const result = await bulkDeleteSkills([{ path: 'a', etag: 'etag-1' }, { path: 'b' }]);

    expect(result.success).toBe(false);
    expect(skillsCoreApi.deleteSkill).not.toHaveBeenCalled();
  });

  test('bulkDeleteSkills deletes each item with its own etag', async () => {
    (skillsCoreApi.deleteSkill as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteSkills([
      { path: 'a', etag: 'etag-1' },
      { path: 'b', etag: 'etag-2' },
    ]);

    expect(skillsCoreApi.deleteSkill).toHaveBeenNthCalledWith(1, TOKEN_MOCK, 'a', 'etag-1');
    expect(skillsCoreApi.deleteSkill).toHaveBeenNthCalledWith(2, TOKEN_MOCK, 'b', 'etag-2');
    expect(result).toEqual({ success: true });
  });

  test('bulkDeleteSkills stops at the first failure (fail-fast)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    (skillsCoreApi.deleteSkill as any).mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true });

    const result = await bulkDeleteSkills([
      { path: 'a', etag: 'etag-1' },
      { path: 'b', etag: 'etag-2' },
    ]);

    expect(skillsCoreApi.deleteSkill).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });
});
