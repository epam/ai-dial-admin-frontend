import { CORE_TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';
import { ResourceType } from '@/src/types/resource-type';
import { AssetApi } from '../asset-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { 'content-type': 'application/json' };

/** The SDK hands `fetch` a `Request`; the hand-written client hands it a URL string. */
const sentRequest = (index = 0): Request => fetch.mock.calls[index][0] as unknown as Request;
const sentBody = (index = 0): Promise<string> => sentRequest(index).clone().text();

describe('Server :: Core :: AssetApi :: Model through the SDK', () => {
  const instance = new AssetApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getContent reads /v1/models/platform/{name} with the caller token', async () => {
    fetch.mockResponseOnce(JSON.stringify({ type: 'chat' }), { headers: JSON_HEADERS });

    const content = await instance.getContent(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4');

    expect(content).toEqual({ type: 'chat' });
    expect(sentRequest().method).toBe('GET');
    expect(sentRequest().url).toBe(`${CORE_TEST_URL}v1/models/platform/gpt-4`);
    expect(sentRequest().headers.get('authorization')).toBe('Bearer access_token_mock');
  });

  test('getContent sends If-None-Match only for a real etag', async () => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });
    await instance.getContent(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4', '"e1"');
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });
    await instance.getContent(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4', '*');

    expect(sentRequest(0).headers.get(IF_NONE_MATCH)).toBe('"e1"');
    expect(sentRequest(1).headers.has(IF_NONE_MATCH)).toBe(false);
  });

  test('getMetadata of a single model asks for the item, non-recursively', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'gpt-4', nodeType: 'ITEM' }), { headers: JSON_HEADERS });

    await instance.getMetadata(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4');

    expect(sentRequest().url).toBe(`${CORE_TEST_URL}v1/metadata/models/platform/gpt-4?recursive=false`);
  });

  test.each(['', 'platform/'])('getMetadata lists the bucket root for the path "%s"', async (path) => {
    fetch.mockResponseOnce(JSON.stringify({ name: '', nodeType: 'FOLDER', items: [] }), { headers: JSON_HEADERS });

    await instance.getMetadata(TOKEN_MOCK, ResourceType.MODEL, path, { recursive: true, nextToken: 'page-2' });

    expect(sentRequest().url).toBe(`${CORE_TEST_URL}v1/metadata/models/platform/?recursive=true&token=page-2`);
  });

  test('list follows the continuation token across pages', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        name: '',
        nodeType: 'FOLDER',
        nextToken: 'page-2',
        items: [{ name: 'a', nodeType: 'ITEM', url: 'models/platform/a' }],
      }),
      { headers: JSON_HEADERS },
    );
    fetch.mockResponseOnce(
      JSON.stringify({
        name: '',
        nodeType: 'FOLDER',
        items: [{ name: 'b', nodeType: 'ITEM', url: 'models/platform/b' }],
      }),
      { headers: JSON_HEADERS },
    );

    const rows = await instance.list(TOKEN_MOCK, ResourceType.MODEL, '');

    expect(rows.map((row) => row.name)).toEqual(['a', 'b']);
    expect(sentRequest(0).url).toBe(`${CORE_TEST_URL}v1/metadata/models/platform/?recursive=false`);
    expect(sentRequest(1).url).toBe(`${CORE_TEST_URL}v1/metadata/models/platform/?recursive=false&token=page-2`);
  });

  test('put without an etag or override creates with If-None-Match: *', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: 'models/platform/gpt-4' }), { headers: JSON_HEADERS });

    const result = await instance.put(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4', { type: 'chat' });

    expect(result.success).toBe(true);
    expect(sentRequest().method).toBe('PUT');
    expect(sentRequest().url).toBe(`${CORE_TEST_URL}v1/models/platform/gpt-4`);
    expect(sentRequest().headers.get(IF_NONE_MATCH)).toBe('*');
    expect(JSON.parse(await sentBody())).toEqual({ type: 'chat' });
  });

  test('put with an etag sends If-Match and no If-None-Match', async () => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });

    await instance.put(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4', { type: 'chat' }, { etag: '"e1"' });

    expect(sentRequest().headers.get(IF_MATCH)).toBe('"e1"');
    expect(sentRequest().headers.has(IF_NONE_MATCH)).toBe(false);
  });

  test('put with the override flag and no etag sends no conditional header', async () => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });

    await instance.put(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4', { type: 'chat' }, { allowOverride: true });

    expect(sentRequest().headers.has(IF_MATCH)).toBe(false);
    expect(sentRequest().headers.has(IF_NONE_MATCH)).toBe(false);
  });

  test('put grafts the admin-format path fields onto a successful response', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: 'models/platform/gpt-4' }), { headers: JSON_HEADERS });

    const result = await instance.put(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4', { type: 'chat' });

    expect(result.response).toEqual({
      url: 'models/platform/gpt-4',
      _metadata: { path: 'gpt-4', folderId: '', name: 'gpt-4' },
    });
  });

  test('put returns a failed write unchanged', async () => {
    fetch.mockResponseOnce('conflict', { status: 412 });

    const result = await instance.put(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4', { type: 'chat' }, { etag: '"old"' });

    expect(result).toMatchObject({ success: false, status: 412 });
    expect(result.response).toBeUndefined();
  });

  test('delete sends DELETE with If-Match when an etag is given and resolves to the body text', async () => {
    fetch.mockResponseOnce('', { status: 200 });
    const result = await instance.delete(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4', '"e2"');
    fetch.mockResponseOnce('', { status: 200 });
    await instance.delete(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4');

    expect(result).toEqual({ success: true, response: '', etag: undefined });
    expect(sentRequest(0).method).toBe('DELETE');
    expect(sentRequest(0).url).toBe(`${CORE_TEST_URL}v1/models/platform/gpt-4`);
    expect(sentRequest(0).headers.get(IF_MATCH)).toBe('"e2"');
    expect(sentRequest(1).headers.has(IF_MATCH)).toBe(false);
  });

  test('getMerged combines the content and metadata reads', async () => {
    fetch.mockResponseOnce(JSON.stringify({ type: 'chat' }), { headers: JSON_HEADERS });
    fetch.mockResponseOnce(JSON.stringify({ name: 'gpt-4', nodeType: 'ITEM', url: 'models/platform/gpt-4' }), {
      headers: JSON_HEADERS,
    });

    const merged = await instance.getMerged(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4');

    expect(merged).toMatchObject({ type: 'chat', _metadata: { name: 'gpt-4', path: 'gpt-4', folderId: '' } });
    expect(sentRequest(0).url).toBe(`${CORE_TEST_URL}v1/models/platform/gpt-4`);
    expect(sentRequest(1).url).toBe(`${CORE_TEST_URL}v1/metadata/models/platform/gpt-4?recursive=false`);
  });

  test('getMergedWithEtag takes the etag from the metadata node, not the content response', async () => {
    fetch.mockResponseOnce(JSON.stringify({ type: 'chat' }), { headers: { ...JSON_HEADERS, etag: '"content-etag"' } });
    fetch.mockResponseOnce(
      JSON.stringify({ name: 'gpt-4', nodeType: 'ITEM', url: 'models/platform/gpt-4', etag: 'meta-etag-1' }),
      { headers: JSON_HEADERS },
    );

    const result = await instance.getMergedWithEtag(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4');

    expect(result.success).toBe(true);
    expect(result.etag).toBe('meta-etag-1');
    expect(result.response).toMatchObject({ type: 'chat', _metadata: { name: 'gpt-4', path: 'gpt-4', folderId: '' } });
  });

  test('getMergedWithEtag propagates a failed content read without reading metadata', async () => {
    fetch.mockResponseOnce('missing', { status: 404 });

    const result = await instance.getMergedWithEtag(TOKEN_MOCK, ResourceType.MODEL, 'gpt-4');

    expect(result).toMatchObject({ success: false, status: 404 });
    expect(fetch.mock.calls).toHaveLength(1);
  });

  test.each([
    [ResourceType.MODEL, 403, undefined],
    [ResourceType.MODEL, 404, null],
    [ResourceType.MODEL, 500, null],
    [ResourceType.ROLE, 403, undefined],
    [ResourceType.ROLE, 404, null],
    [ResourceType.ROLE, 500, null],
  ])('a %s content or metadata read answered with %i resolves to %s', async (type, status, expected) => {
    fetch.mockResponseOnce('no', { status });
    fetch.mockResponseOnce('no', { status });

    expect(await instance.getContent(TOKEN_MOCK, type, 'name')).toBe(expected);
    expect(await instance.getMetadata(TOKEN_MOCK, type, 'name')).toBe(expected);
  });
});

describe('Server :: Core :: AssetApi :: SDK dispatch', () => {
  const instance = new AssetApi({ host: CORE_TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('a type with no SDK row yet is still read by the hand-written client at its own URL', async () => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });

    await instance.getContent(TOKEN_MOCK, ResourceType.ROLE, 'my-role');

    expect(fetch.mock.calls[0][0]).toBe(`${CORE_TEST_URL}v1/roles/platform/my-role`);
  });

  test('a type with neither an SDK row nor a URL fails with an error naming it', async () => {
    const unknown = 'unknown-type' as ResourceType;

    expect(() => instance.getContent(TOKEN_MOCK, unknown, 'x')).toThrow(
      'No Core URL or SDK operation for resource type: unknown-type',
    );
    expect(() => instance.getMetadata(TOKEN_MOCK, unknown, 'x')).toThrow('unknown-type');
    expect(() => instance.delete(TOKEN_MOCK, unknown, 'x')).toThrow('unknown-type');
    expect(fetch.mock.calls).toHaveLength(0);
  });
});
