import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { IF_NONE_MATCH } from '@/src/constants/api-headers';
import { readArchiveFileSizes } from '../project-archive';
import { ProjectsCoreApi } from '../projects-core-api';

vi.mock('../project-archive', () => ({ readArchiveFileSizes: vi.fn() }));

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

describe('Server :: Core :: ProjectsCoreApi', () => {
  const instance = new ProjectsCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
    vi.mocked(readArchiveFileSizes).mockReset();
  });

  test('createProject PUTs a manifest-only bundle with the chat-compatible PROJECT.md', async () => {
    fetch.mockResponseOnce('');

    await instance.createProject(TOKEN_MOCK, 'public/my-project', 'my-project', 'A description');

    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain('/v2/projects/public/my-project');
    expect((init as RequestInit).method).toBe('PUT');
    expect((init as RequestInit).headers).toMatchObject({ [IF_NONE_MATCH]: '*' });
    const form = (init as RequestInit).body as FormData;
    expect(form.getAll('file')).toHaveLength(1);
    const file = form.get('file') as File;
    expect(file.name).toBe('PROJECT.md');
    expect(await file.text()).toBe('---\nname: my-project\ndescription: A description\n---\n\n');
  });

  test('getProjectMetadata reads the project node and its files from the projects routes', async () => {
    fetch.mockResponse((req) => {
      if (req.url.includes('/files')) {
        return Promise.resolve(
          JSON.stringify({
            items: [
              { name: 'PROJECT.md', url: 'projects/public/p/files/PROJECT.md', nodeType: 'ITEM' },
              { name: 'a.csv', url: 'projects/public/p/files/context/a.csv', nodeType: 'ITEM' },
            ],
          }),
        );
      }
      return Promise.resolve(
        JSON.stringify({ name: 'p', url: 'projects/public/p/', nodeType: 'ITEM', author: 'me', etag: 'e1' }),
      );
    }, JSON_HEADERS);

    const project = await instance.getProjectMetadata(TOKEN_MOCK, 'public/p');

    const urls = fetch.mock.calls.map((c) => String(c[0]));
    const archiveUrls = urls.filter((u) => !u.includes('/v2/metadata/'));
    // The item node and the files listing come from the metadata routes; the only other request is the archive.
    expect(urls.filter((u) => u.includes('/v2/metadata/projects/'))).toHaveLength(2);
    expect(archiveUrls).toHaveLength(1);
    expect(archiveUrls[0]).toContain('/v2/projects/public/p');
    expect(project).toMatchObject({
      name: 'p',
      folderId: 'public/',
      etag: 'e1',
      files: [{ name: 'PROJECT.md' }, { name: 'context/a.csv' }],
    });
  });

  test('getProjectMetadata is null when the path is not a project item', async () => {
    fetch.mockResponse(JSON.stringify({ name: 'public', nodeType: 'FOLDER' }), JSON_HEADERS);

    expect(await instance.getProjectMetadata(TOKEN_MOCK, 'public/p')).toBeNull();
  });

  describe('file sizes from the project archive', () => {
    const mockProject = (archive: { status?: number; headers?: Record<string, string> }) => {
      fetch.mockResponse((req) => {
        if (req.url.includes('/v2/metadata/projects') && req.url.includes('/files')) {
          return Promise.resolve(
            JSON.stringify({
              items: [
                { name: 'PROJECT.md', url: 'projects/public/p/files/PROJECT.md', nodeType: 'ITEM' },
                { name: 'a.csv', url: 'projects/public/p/files/context/a.csv', nodeType: 'ITEM' },
              ],
            }),
          );
        }
        if (req.url.includes('/v2/metadata/projects')) {
          return Promise.resolve(
            JSON.stringify({ name: 'p', url: 'projects/public/p/', nodeType: 'ITEM', etag: 'e1' }),
          );
        }
        return Promise.resolve({ body: 'zip-bytes', status: archive.status ?? 200, headers: archive.headers });
      }, JSON_HEADERS);
    };

    test('reads the whole-bundle archive from the projects route and adds each file size', async () => {
      mockProject({});
      vi.mocked(readArchiveFileSizes).mockResolvedValue(
        new Map([
          ['PROJECT.md', 40],
          ['context/a.csv', 1234],
        ]),
      );

      const project = await instance.getProjectMetadata(TOKEN_MOCK, 'public/p');

      const archiveCall = fetch.mock.calls.find(([url]) => !String(url).includes('/metadata/'));
      expect(String(archiveCall?.[0])).toContain('/v2/projects/public/p');
      expect(project?.files).toEqual([
        { name: 'PROJECT.md', size: 40 },
        { name: 'context/a.csv', size: 1234 },
      ]);
    });

    test('gives the archive request a timeout signal so a stalled archive cannot hold the page up', async () => {
      mockProject({});
      vi.mocked(readArchiveFileSizes).mockResolvedValue(new Map());

      await instance.getProjectMetadata(TOKEN_MOCK, 'public/p');

      const archiveCall = fetch.mock.calls.find(([url]) => !String(url).includes('/metadata/'));
      expect((archiveCall?.[1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
    });

    test('leaves a file without a size when the archive has no entry for it', async () => {
      mockProject({});
      vi.mocked(readArchiveFileSizes).mockResolvedValue(new Map([['PROJECT.md', 40]]));

      const project = await instance.getProjectMetadata(TOKEN_MOCK, 'public/p');

      expect(project?.files.find((file) => file.name === 'context/a.csv')?.size).toBeUndefined();
    });

    test('still returns the project, without sizes, when the archive request fails', async () => {
      mockProject({ status: 500 });

      const project = await instance.getProjectMetadata(TOKEN_MOCK, 'public/p');

      expect(readArchiveFileSizes).not.toHaveBeenCalled();
      expect(project?.files.map((file) => file.name)).toEqual(['PROJECT.md', 'context/a.csv']);
      expect(project?.files.every((file) => file.size === undefined)).toBe(true);
    });

    test('still returns the project, without sizes, when the archive cannot be parsed', async () => {
      mockProject({});
      vi.mocked(readArchiveFileSizes).mockRejectedValue(new Error('bad zip'));

      const project = await instance.getProjectMetadata(TOKEN_MOCK, 'public/p');

      expect(project?.name).toBe('p');
      expect(project?.files.every((file) => file.size === undefined)).toBe(true);
    });

    test('does not read an archive declared larger than the cap', async () => {
      mockProject({ headers: { 'content-length': String(65 * 1024 * 1024) } });

      const project = await instance.getProjectMetadata(TOKEN_MOCK, 'public/p');

      expect(readArchiveFileSizes).not.toHaveBeenCalled();
      expect(project?.files.every((file) => file.size === undefined)).toBe(true);
    });

    test('is still null for a path that is not a project, whatever the archive says', async () => {
      fetch.mockResponse(JSON.stringify({ name: 'public', nodeType: 'FOLDER' }), JSON_HEADERS);
      vi.mocked(readArchiveFileSizes).mockResolvedValue(new Map());

      expect(await instance.getProjectMetadata(TOKEN_MOCK, 'public/p')).toBeNull();
    });
  });
});
