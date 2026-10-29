import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';
import { ResourceType } from '@/src/types/resource-type';
import { ComplexResourceCoreApi, ComplexResourceGroup } from '../complex-resource-core-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

const GROUPS: [string, ComplexResourceGroup][] = [
  [
    'skills',
    { type: ResourceType.SKILL, contentUrl: 'v2/skills', metadataUrl: 'v2/metadata/skills', manifestFile: 'SKILL.md' },
  ],
  [
    'projects',
    {
      type: ResourceType.SKILL,
      contentUrl: 'v2/projects',
      metadataUrl: 'v2/metadata/projects',
      manifestFile: 'PROJECT.md',
    },
  ],
];

/** Exposes the protected operations so the shared client is exercised without a group subclass. */
class TestApi extends ComplexResourceCoreApi {
  constructor(group: ComplexResourceGroup) {
    super({ host: TEST_URL }, group);
  }

  create = (path: string, content: string) => this.createResource(TOKEN_MOCK, path, content);
  remove = (path: string, etag: string) => this.deleteResource(TOKEN_MOCK, path, etag);
  removeFolder = (path: string) => this.deleteResourceFolder(TOKEN_MOCK, path, '*');
  list = (path: string) => this.listResourceMetadata(TOKEN_MOCK, path);
  manifest = (path: string) => this.getManifestContent(TOKEN_MOCK, path);
  upload = (path: string, file: string, content: File) => this.uploadResourceFile(TOKEN_MOCK, path, file, content);
}

describe.each(GROUPS)('Server :: Core :: ComplexResourceCoreApi :: %s group', (_name, group) => {
  const api = new TestApi(group);

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('create PUTs the group route with a single manifest part and If-None-Match', async () => {
    fetch.mockResponseOnce('');

    await api.create('public/a', '---\nname: a\n---\n');

    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain(`/${group.contentUrl}/public/a`);
    expect((init as RequestInit).method).toBe('PUT');
    expect((init as RequestInit).headers).toMatchObject({ [IF_NONE_MATCH]: '*' });
    const file = ((init as RequestInit).body as FormData).get('file') as File;
    expect(file.name).toBe(group.manifestFile);
  });

  test('delete rejects without a request when the etag is empty', async () => {
    await expect(api.remove('public/a', '')).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('delete sends If-Match to the group route', async () => {
    fetch.mockResponseOnce('');

    await api.remove('public/a', 'e1');

    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain(`/${group.contentUrl}/public/a`);
    expect((init as RequestInit).headers).toMatchObject({ [IF_MATCH]: 'e1' });
  });

  test('folder delete appends exactly one trailing slash', async () => {
    fetch.mockResponseOnce('');

    await api.removeFolder('public/dir/');

    expect(String(fetch.mock.calls[0][0])).toContain(`/${group.contentUrl}/public/dir/`);
    expect(String(fetch.mock.calls[0][0])).not.toContain('dir//');
  });

  test('listing targets the group metadata route non-recursively', async () => {
    fetch.mockResponseOnce(JSON.stringify({ items: [] }), JSON_HEADERS);

    await api.list('public/');

    const url = String(fetch.mock.calls[0][0]);
    expect(url).toContain(`/${group.metadataUrl}/public/`);
    expect(url).toContain('recursive=false');
  });

  test('manifest content is read from the group manifest file', async () => {
    fetch.mockResponseOnce('---\nname: a\n---\nbody', { headers: { 'content-type': 'text/markdown' } });

    const result = await api.manifest('public/a');

    expect(String(fetch.mock.calls[0][0])).toContain(`/${group.contentUrl}/public/a/files/${group.manifestFile}`);
    expect(result).toMatchObject({ success: true, response: '---\nname: a\n---\nbody' });
  });

  test('a manifest read failure maps to an error response', async () => {
    fetch.mockResponseOnce('missing', { status: 404 });

    const result = await api.manifest('public/a');

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
  });

  test('file upload PUTs to the per-file route', async () => {
    fetch.mockResponseOnce('');

    await api.upload('public/a', 'context/x.csv', new File(['x'], 'x.csv'));

    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain(`/${group.contentUrl}/public/a/files/context/x.csv`);
    expect((init as RequestInit).method).toBe('PUT');
  });
});
