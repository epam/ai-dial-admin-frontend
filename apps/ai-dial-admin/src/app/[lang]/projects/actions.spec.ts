import { beforeEach, describe, expect, test, vi } from 'vitest';

import { projectsCoreApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  bulkDeleteProjects,
  createProject,
  createProjectFolder,
  getProject,
  getProjectManifest,
  getContextLimits,
  getProjects,
  removeProject,
  removeProjectFile,
  uploadProjectFile,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Assets Projects :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('getProjects maps a single page of folder metadata into rows, splitting nested folder from name', async () => {
    (projectsCoreApi.listProjectMetadata as any).mockResolvedValue({
      name: 'public',
      nodeType: 'FOLDER',
      items: [
        {
          name: 'my-project',
          url: 'projects/public/nested/my-project',
          nodeType: 'ITEM',
          author: 'a',
          updatedAt: 1,
          etag: 'etag-1',
        },
      ],
    });

    const result = await getProjects('public/nested/');

    expect(getUserToken).toHaveBeenCalled();
    expect(projectsCoreApi.listProjectMetadata).toHaveBeenCalledWith(TOKEN_MOCK, 'public/nested/', {
      nextToken: undefined,
    });
    expect(result).toEqual([
      expect.objectContaining({
        name: 'my-project',
        folderId: 'public/nested/',
        path: 'public/nested/my-project',
        author: 'a',
        nodeType: 'item',
        etag: 'etag-1',
      }),
    ]);
  });

  test('getProjects follows the continuation token until the folder is fully read', async () => {
    (projectsCoreApi.listProjectMetadata as any)
      .mockResolvedValueOnce({ name: 'public', nodeType: 'FOLDER', items: [], nextToken: 'page-2' })
      .mockResolvedValueOnce({ name: 'public', nodeType: 'FOLDER', items: [] });

    await getProjects('public/');

    expect(projectsCoreApi.listProjectMetadata).toHaveBeenCalledTimes(2);
    expect(projectsCoreApi.listProjectMetadata).toHaveBeenNthCalledWith(2, TOKEN_MOCK, 'public/', {
      nextToken: 'page-2',
    });
  });

  test('getProject wraps a found project in a successful ServerActionResponse', async () => {
    const project = { name: 'my-project', path: 'public/my-project', files: [], etag: 'etag-1' };
    (projectsCoreApi.getProjectMetadata as any).mockResolvedValue(project);

    const result = await getProject('public/my-project');

    expect(projectsCoreApi.getProjectMetadata).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-project');
    expect(result).toEqual({ success: true, response: project, etag: 'etag-1' });
  });

  test('getProject reports not-found when the project resource is missing', async () => {
    (projectsCoreApi.getProjectMetadata as any).mockResolvedValue(null);

    const result = await getProject('public/missing');

    expect(result.success).toBe(false);
  });

  test('removeProject delegates to the Core client', async () => {
    (projectsCoreApi.deleteProject as any).mockResolvedValue({ success: true });

    const result = await removeProject('public/my-project', 'etag-1');

    expect(projectsCoreApi.deleteProject).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-project', 'etag-1');
    expect(result).toEqual({ success: true });
  });

  test('uploadProjectFile extracts the file from the FormData and delegates to the Core client', async () => {
    (projectsCoreApi.uploadProjectFile as any).mockResolvedValue({ success: true });
    const file = new File(['content'], 'notes.md');
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadProjectFile('public/my-project', 'notes.md', formData);

    expect(projectsCoreApi.uploadProjectFile).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-project', 'notes.md', file);
    expect(result).toEqual({ success: true });
  });

  test('uploadProjectFile rejects before calling Core when the FormData has no file', async () => {
    const result = await uploadProjectFile('public/my-project', 'notes.md', new FormData());

    expect(result.success).toBe(false);
    expect(projectsCoreApi.uploadProjectFile).not.toHaveBeenCalled();
  });

  test('getProjectManifest delegates to the Core client', async () => {
    (projectsCoreApi.getProjectManifestContent as any).mockResolvedValue({
      success: true,
      response: '---\nname: my-project\ndescription: Does a thing\n---\nBody.',
    });

    const result = await getProjectManifest('public/my-project');

    expect(projectsCoreApi.getProjectManifestContent).toHaveBeenCalledWith(TOKEN_MOCK, 'public/my-project');
    expect(result).toEqual({
      success: true,
      response: '---\nname: my-project\ndescription: Does a thing\n---\nBody.',
    });
  });

  test('getProjectManifest reports not-found when the manifest cannot be read', async () => {
    (projectsCoreApi.getProjectManifestContent as any).mockResolvedValue({ success: false });

    const result = await getProjectManifest('public/missing');

    expect(result.success).toBe(false);
  });

  test('removeProjectFile delegates to the Core client, etag optional', async () => {
    (projectsCoreApi.deleteProjectFile as any).mockResolvedValue({ success: true });

    const result = await removeProjectFile('public/my-project', 'notes.md', 'etag-1');

    expect(projectsCoreApi.deleteProjectFile).toHaveBeenCalledWith(
      TOKEN_MOCK,
      'public/my-project',
      'notes.md',
      'etag-1',
    );
    expect(result).toEqual({ success: true });
  });

  test('bulkDeleteProjects rejects the whole batch before calling Core if any item lacks an etag', async () => {
    const result = await bulkDeleteProjects([{ path: 'a', etag: 'etag-1' }, { path: 'b' }]);

    expect(result.success).toBe(false);
    expect(projectsCoreApi.deleteProject).not.toHaveBeenCalled();
  });

  test('bulkDeleteProjects deletes each item with its own etag', async () => {
    (projectsCoreApi.deleteProject as any).mockResolvedValue({ success: true });

    const result = await bulkDeleteProjects([
      { path: 'a', etag: 'etag-1' },
      { path: 'b', etag: 'etag-2' },
    ]);

    expect(projectsCoreApi.deleteProject).toHaveBeenNthCalledWith(1, TOKEN_MOCK, 'a', 'etag-1');
    expect(projectsCoreApi.deleteProject).toHaveBeenNthCalledWith(2, TOKEN_MOCK, 'b', 'etag-2');
    expect(result).toEqual({ success: true });
  });

  test('createProject builds the path from folderId + name and delegates to the Core client', async () => {
    (projectsCoreApi.createProject as any).mockResolvedValue({ success: true });

    const result = await createProject('my-project', 'Does a thing', 'public/');

    expect(projectsCoreApi.createProject).toHaveBeenCalledWith(
      TOKEN_MOCK,
      'public/my-project',
      'my-project',
      'Does a thing',
    );
    expect(result).toEqual({ success: true });
  });

  test('createProject inserts the missing separator when folderId has no trailing slash', async () => {
    // A nested folder's own path (after navigating into it) doesn't carry a trailing slash, unlike
    // the root's `public/` — concatenating it verbatim previously produced `New folder 1my-project`.
    (projectsCoreApi.createProject as any).mockResolvedValue({ success: true });

    await createProject('my-project', 'Does a thing', 'public/New folder 1');

    expect(projectsCoreApi.createProject).toHaveBeenCalledWith(
      TOKEN_MOCK,
      'public/New folder 1/my-project',
      'my-project',
      'Does a thing',
    );
  });

  test('createProjectFolder delegates to the Core client', async () => {
    (projectsCoreApi.createProjectFolder as any).mockResolvedValue({ success: true });

    const result = await createProjectFolder('public/new-folder');

    expect(projectsCoreApi.createProjectFolder).toHaveBeenCalledWith(TOKEN_MOCK, 'public/new-folder');
    expect(result).toEqual({ success: true });
  });

  test('bulkDeleteProjects stops at the first failure (fail-fast)', async () => {
    const failure = { success: false, errorHeader: 'Error', errorMessage: 'boom' };
    (projectsCoreApi.deleteProject as any).mockResolvedValueOnce(failure).mockResolvedValueOnce({ success: true });

    const result = await bulkDeleteProjects([
      { path: 'a', etag: 'etag-1' },
      { path: 'b', etag: 'etag-2' },
    ]);

    expect(projectsCoreApi.deleteProject).toHaveBeenCalledTimes(1);
    expect(result).toBe(failure);
  });
});

describe('Assets Projects :: getContextLimits', () => {
  test('returns the limits read from the environment', async () => {
    vi.stubEnv('PROJECT_CONTEXT_FILE_MAX_BYTES', '2048');

    const limits = await getContextLimits();

    expect(limits.maxFileBytes).toBe(2048);
    vi.unstubAllEnvs();
  });
});
