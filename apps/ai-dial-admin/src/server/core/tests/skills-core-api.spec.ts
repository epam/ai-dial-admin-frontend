import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { IF_MATCH } from '@/src/constants/api-headers';
import { SkillsCoreApi } from '../skills-core-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const jsonResponse = (body: unknown) => JSON.stringify(body);
const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

describe('Server :: Core :: SkillsCoreApi :: getSkillMetadata', () => {
  const instance = new SkillsCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test("reads the files listing and the parent folder's row for author/dates/etag, with no manifest fetch", async () => {
    fetch
      .mockResponseOnce(
        jsonResponse({ items: [{ name: 'SKILL.md', url: 'skills/public/my-skill/files/SKILL.md', nodeType: 'ITEM' }] }),
        JSON_HEADERS,
      )
      .mockResponseOnce(
        jsonResponse({
          name: 'public',
          nodeType: 'FOLDER',
          items: [
            {
              name: 'my-skill',
              // A skill's own marker is stored as a folder-shaped resource, so its listing row's
              // `url` carries a trailing slash even though it's classified `nodeType: 'ITEM'`.
              url: 'skills/public/my-skill/',
              nodeType: 'ITEM',
              author: 'author-1',
              createdAt: 1000,
              updatedAt: 2000,
              etag: 'etag-1',
            },
          ],
        }),
        JSON_HEADERS,
      );

    const skill = await instance.getSkillMetadata(TOKEN_MOCK, 'public/my-skill');

    // Only two Core requests: the files listing and a single (non-paginated) read of the parent
    // folder — no manifest fetch, since the parent listing row already carries the aggregate etag.
    expect(fetch).toHaveBeenCalledTimes(2);
    const [filesUrl] = fetch.mock.calls[0];
    const [parentUrl] = fetch.mock.calls[1];
    expect(filesUrl).toContain('/v2/metadata/skills/public/my-skill/files');
    expect(parentUrl).toContain('/v2/metadata/skills/public/');
    expect(skill).toEqual({
      name: 'my-skill',
      path: 'public/my-skill',
      folderId: 'public/',
      etag: 'etag-1',
      author: 'author-1',
      createdAt: 1000,
      updatedAt: 2000,
      files: [{ name: 'SKILL.md' }],
    });
  });

  test('returns null when the skill has no matching row in its parent listing', async () => {
    fetch
      .mockResponseOnce(jsonResponse({ items: [] }), JSON_HEADERS)
      .mockResponseOnce(jsonResponse({ name: 'public', nodeType: 'FOLDER', items: [] }), JSON_HEADERS);

    const skill = await instance.getSkillMetadata(TOKEN_MOCK, 'public/missing');

    expect(skill).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('does not paginate through the parent listing beyond its first page', async () => {
    fetch
      .mockResponseOnce(jsonResponse({ items: [] }), JSON_HEADERS)
      .mockResponseOnce(
        jsonResponse({ name: 'public', nodeType: 'FOLDER', items: [], nextToken: 'page-2' }),
        JSON_HEADERS,
      );

    await instance.getSkillMetadata(TOKEN_MOCK, 'public/my-skill');

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('Server :: Core :: SkillsCoreApi :: getSkillFiles', () => {
  const instance = new SkillsCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('requests the files listing recursively', async () => {
    fetch.mockResponseOnce(jsonResponse({ items: [] }), JSON_HEADERS);

    await instance.getSkillFiles(TOKEN_MOCK, 'public/my-skill');

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v2/metadata/skills/public/my-skill/files');
    expect(calledUrl).toContain('recursive=true');
  });

  test("derives each file's name relative to the skill root, including nested files", async () => {
    fetch.mockResponseOnce(
      jsonResponse({
        items: [
          { name: 'SKILL.md', url: 'skills/public/my-skill/files/SKILL.md', nodeType: 'ITEM' },
          { name: 'run.sh', url: 'skills/public/my-skill/files/scripts/run.sh', nodeType: 'ITEM' },
        ],
      }),
      JSON_HEADERS,
    );

    const files = await instance.getSkillFiles(TOKEN_MOCK, 'public/my-skill');

    expect(files).toEqual([{ name: 'SKILL.md' }, { name: 'scripts/run.sh' }]);
  });

  test('excludes grouping-folder entries, keeping only files', async () => {
    fetch.mockResponseOnce(
      jsonResponse({
        items: [
          { name: 'scripts', url: 'skills/public/my-skill/files/scripts', nodeType: 'FOLDER' },
          { name: 'run.sh', url: 'skills/public/my-skill/files/scripts/run.sh', nodeType: 'ITEM' },
        ],
      }),
      JSON_HEADERS,
    );

    const files = await instance.getSkillFiles(TOKEN_MOCK, 'public/my-skill');

    expect(files).toEqual([{ name: 'scripts/run.sh' }]);
  });

  test('returns an empty list when the response has no items', async () => {
    fetch.mockResponseOnce(jsonResponse({}), JSON_HEADERS);

    const files = await instance.getSkillFiles(TOKEN_MOCK, 'public/my-skill');

    expect(files).toEqual([]);
  });
});

describe('Server :: Core :: SkillsCoreApi :: listSkillMetadata', () => {
  const instance = new SkillsCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('lists the direct children of a skill folder without a per-child request', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        name: 'public',
        nodeType: 'FOLDER',
        items: [
          { name: 'my-skill', url: 'skills/public/my-skill', nodeType: 'ITEM', author: 'a', updatedAt: 1 },
          { name: 'sub-folder', url: 'skills/public/sub-folder/', nodeType: 'FOLDER' },
        ],
      }),
      { headers: { 'content-type': 'application/json' } },
    );

    const node = await instance.listSkillMetadata(TOKEN_MOCK, 'public/');

    expect(fetch).toHaveBeenCalledOnce();
    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v2/metadata/skills/public/');
    expect(calledUrl).toContain('recursive=false');
    expect((init as RequestInit).method).toBe('GET');
    expect(node?.items).toHaveLength(2);
  });

  test('sends the continuation token as `token` when paginating', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'public', nodeType: 'FOLDER', items: [] }), {
      headers: { 'content-type': 'application/json' },
    });

    await instance.listSkillMetadata(TOKEN_MOCK, 'public/', { nextToken: 'page-2' });

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('token=page-2');
  });
});

describe('Server :: Core :: SkillsCoreApi :: uploadSkillFile', () => {
  const instance = new SkillsCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('PUTs multipart form data with a "file" part to the skill\'s per-file route', async () => {
    fetch.mockResponseOnce(jsonResponse({ success: true }));
    const file = new File(['data'], 'notes.md', { type: 'text/markdown' });

    await instance.uploadSkillFile(TOKEN_MOCK, 'public/my-skill', 'notes.md', file);

    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v2/skills/public/my-skill/files/notes.md');
    expect((init as RequestInit).method).toBe('PUT');
    expect((init as RequestInit).body).toBeInstanceOf(FormData);
  });

  test('defaults to overwrite semantics', async () => {
    fetch.mockResponseOnce(jsonResponse({ success: true }));
    const file = new File(['data'], 'notes.md');

    await instance.uploadSkillFile(TOKEN_MOCK, 'public/my-skill', 'notes.md', file);

    const [, init] = fetch.mock.calls[0];
    expect((init as RequestInit).headers).not.toHaveProperty('If-None-Match');
  });

  test('supports a nested filePath', async () => {
    fetch.mockResponseOnce(jsonResponse({ success: true }));
    const file = new File(['data'], 'run.sh');

    await instance.uploadSkillFile(TOKEN_MOCK, 'public/my-skill', 'scripts/run.sh', file);

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v2/skills/public/my-skill/files/scripts/run.sh');
  });
});

describe('Server :: Core :: SkillsCoreApi :: downloadSkillFile / previewSkillFile', () => {
  const instance = new SkillsCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test("downloadSkillFile GETs the skill's per-file route", async () => {
    fetch.mockResponseOnce('file content');

    await instance.downloadSkillFile(TOKEN_MOCK, 'public/my-skill', 'SKILL.md');

    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v2/skills/public/my-skill/files/SKILL.md');
    expect((init as RequestInit).method).toBe('GET');
  });

  test('previewSkillFile GETs the same route', async () => {
    fetch.mockResponseOnce('file content');

    await instance.previewSkillFile(TOKEN_MOCK, 'public/my-skill', 'SKILL.md');

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v2/skills/public/my-skill/files/SKILL.md');
  });
});

describe('Server :: Core :: SkillsCoreApi :: deleteSkillFile', () => {
  const instance = new SkillsCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test("DELETEs the skill's per-file route without requiring an etag", async () => {
    fetch.mockResponseOnce('');

    await instance.deleteSkillFile(TOKEN_MOCK, 'public/my-skill', 'notes.md');

    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v2/skills/public/my-skill/files/notes.md');
    expect((init as RequestInit).method).toBe('DELETE');
    expect((init as RequestInit).headers).not.toHaveProperty(IF_MATCH);
  });

  test('sends If-Match when an etag is supplied', async () => {
    fetch.mockResponseOnce('');

    await instance.deleteSkillFile(TOKEN_MOCK, 'public/my-skill', 'notes.md', 'etag-1');

    const [, init] = fetch.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ [IF_MATCH]: 'etag-1' });
  });
});

describe('Server :: Core :: SkillsCoreApi :: deleteSkill', () => {
  const instance = new SkillsCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('rejects before calling Core when the etag is missing', async () => {
    await expect(instance.deleteSkill(TOKEN_MOCK, 'public/my-skill', '')).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('sends If-Match when a concrete etag is supplied', async () => {
    fetch.mockResponseOnce('');

    await instance.deleteSkill(TOKEN_MOCK, 'public/my-skill', 'etag-1');

    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v2/skills/public/my-skill');
    expect((init as RequestInit).method).toBe('DELETE');
    expect((init as RequestInit).headers).toMatchObject({ [IF_MATCH]: 'etag-1' });
  });
});

describe('Server :: Core :: SkillsCoreApi :: deleteSkillFolder', () => {
  const instance = new SkillsCoreApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('DELETEs the trailing-slash folder route, distinct from deleteSkill', async () => {
    fetch.mockResponseOnce('');

    // '*' is Core's own convention for "unconditional" — `createIfMatchHeaders` renders it as no
    // `If-Match` header at all rather than a literal `If-Match: *`.
    await instance.deleteSkillFolder(TOKEN_MOCK, 'public/archive', '*');

    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v2/skills/public/archive/');
    expect((init as RequestInit).method).toBe('DELETE');
    expect((init as RequestInit).headers).not.toHaveProperty(IF_MATCH);
  });

  test('sends a concrete If-Match when a real etag is supplied', async () => {
    fetch.mockResponseOnce('');

    await instance.deleteSkillFolder(TOKEN_MOCK, 'public/archive', 'etag-1');

    const [, init] = fetch.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ [IF_MATCH]: 'etag-1' });
  });
});
