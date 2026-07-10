import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';
import { ResourceType } from '@/src/types/resource-type';
import { AssetApi } from '../asset-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: Core :: AssetApi', () => {
  const instance = new AssetApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getMetadata calls the per-type metadata endpoint with recursive flag', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'x', nodeType: 'ITEM', items: [] }));

    await instance.getMetadata(TOKEN_MOCK, ResourceType.TOOLSET, 'folder/x', { recursive: true });

    const [calledUrl] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/metadata/toolsets/folder/x');
    expect(calledUrl).toContain('recursive=true');
  });

  test('getMetadata defaults path to public/ for conversation and prompt when omitted', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'x', nodeType: 'FOLDER', items: [] }));
    await instance.getMetadata(TOKEN_MOCK, ResourceType.CONVERSATION, '');
    expect(fetch.mock.calls[0][0]).toContain('/v1/metadata/conversations/public/');
  });

  test('getMetadata does not default path for application-resource when omitted', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'x', nodeType: 'FOLDER', items: [] }));
    await instance.getMetadata(TOKEN_MOCK, ResourceType.APPLICATION, '');
    expect(fetch.mock.calls[0][0]).not.toContain('/public/');
  });

  test('list maps both ITEM and FOLDER nodes into resource info rows, tagged with nodeType', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        name: 'folder',
        nodeType: 'FOLDER',
        items: [
          { name: 'a', nodeType: 'ITEM', url: 'prompts/folder/a__1.0', author: 'me', updatedAt: 123 },
          { name: 'sub', nodeType: 'FOLDER', url: 'prompts/folder/sub/' },
        ],
      }),
      { headers: { 'content-type': 'application/json' } },
    );

    const result = await instance.list(TOKEN_MOCK, ResourceType.PROMPT, 'folder/');

    expect(result).toEqual([
      {
        name: 'a',
        folderId: 'folder/',
        path: 'folder/a__1.0',
        version: '1.0',
        author: 'me',
        updatedAt: '123',
        nodeType: 'item',
      },
      {
        name: '',
        folderId: 'folder/sub/',
        path: 'folder/sub/',
        version: undefined,
        author: undefined,
        updatedAt: undefined,
        nodeType: 'folder',
      },
    ]);
  });

  test('getContent sends If-None-Match when an etag is supplied', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: 'hi' }));
    await instance.getContent(TOKEN_MOCK, ResourceType.PROMPT, 'folder/a__1.0', 'etag-1');
    const [, init] = fetch.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ [IF_NONE_MATCH]: 'etag-1' });
  });

  test('getMerged combines content and metadata using the type mapper', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: 'hello' }), {
      headers: { 'content-type': 'application/json' },
    });
    fetch.mockResponseOnce(
      JSON.stringify({ name: 'a__1.0', nodeType: 'ITEM', url: 'prompts/folder/a__1.0', author: 'me', updatedAt: 5 }),
      { headers: { 'content-type': 'application/json' } },
    );

    const result = await instance.getMerged(TOKEN_MOCK, ResourceType.PROMPT, 'folder/a__1.0');

    expect(result).toMatchObject({
      content: 'hello',
      name: 'a',
      folderId: 'folder/',
      path: 'folder/a__1.0',
      version: '1.0',
      author: 'me',
    });
  });

  test('getMergedWithEtag returns the merged resource plus the content resource etag', async () => {
    fetch.mockResponseOnce(JSON.stringify({ content: 'hello' }), {
      headers: { 'content-type': 'application/json', etag: 'etag-9' },
    });
    fetch.mockResponseOnce(
      JSON.stringify({ name: 'a__1.0', nodeType: 'ITEM', url: 'prompts/folder/a__1.0', author: 'me', updatedAt: 5 }),
      { headers: { 'content-type': 'application/json' } },
    );

    const result = await instance.getMergedWithEtag(TOKEN_MOCK, ResourceType.PROMPT, 'folder/a__1.0');

    expect(result.success).toBe(true);
    expect(result.etag).toBe('etag-9');
    expect(result.response).toMatchObject({ content: 'hello', name: 'a', version: '1.0' });
  });

  test('getMergedWithEtag propagates a failed content fetch without calling metadata', async () => {
    fetch.mockResponseOnce('not found', { status: 404 });

    const result = await instance.getMergedWithEtag(TOKEN_MOCK, ResourceType.PROMPT, 'folder/missing');

    expect(result.success).toBe(false);
    expect(fetch.mock.calls).toHaveLength(1);
  });

  test('move calls the generic Core ops/resource/move endpoint with prefixed, encoded URLs', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));

    await instance.move(TOKEN_MOCK, ResourceType.PROMPT, 'folder/a__1.0', 'new folder/a__1.0', true);

    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/ops/resource/move');
    expect((init as RequestInit).method).toBe('POST');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      sourceUrl: 'prompts/folder/a__1.0',
      destinationUrl: 'prompts/new%20folder/a__1.0',
      overwrite: true,
    });
  });

  test('put without an etag or override rejects existing resources (If-None-Match: *)', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.put(TOKEN_MOCK, ResourceType.TOOLSET, 'folder/t__1', { name: 't' });
    const [calledUrl, init] = fetch.mock.calls[0];
    expect(calledUrl).toContain('/v1/toolsets/folder/t__1');
    expect((init as RequestInit).method).toBe('PUT');
    expect((init as RequestInit).headers).toMatchObject({ [IF_NONE_MATCH]: '*' });
  });

  test('put with an etag sends If-Match', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.put(TOKEN_MOCK, ResourceType.TOOLSET, 'folder/t__1', { name: 't' }, { etag: 'abc' });
    const [, init] = fetch.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ [IF_MATCH]: 'abc' });
  });

  test('put injects a prefixed-path id for prompts, matching the backend PromptClientMapper', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.put(TOKEN_MOCK, ResourceType.PROMPT, 'folder/p__1.0', { name: 'p', id: 'stale-id' });
    const body = JSON.parse((fetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ name: 'p', id: 'prompts/folder/p__1.0' });
  });

  test('put does not inject an id for toolsets/applications, which have no id field', async () => {
    fetch.mockResponseOnce(JSON.stringify({}));
    await instance.put(TOKEN_MOCK, ResourceType.TOOLSET, 'folder/t__1', { name: 't' });
    const body = JSON.parse((fetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ name: 't' });
  });

  test('delete sends If-Match when an etag is supplied, no header otherwise', async () => {
    fetch.mockResponseOnce('');
    await instance.delete(TOKEN_MOCK, ResourceType.CONVERSATION, 'folder/c', 'etag-2');
    expect((fetch.mock.calls[0][1] as RequestInit).headers).toMatchObject({ [IF_MATCH]: 'etag-2' });

    fetch.mockResponseOnce('');
    await instance.delete(TOKEN_MOCK, ResourceType.CONVERSATION, 'folder/c');
    expect((fetch.mock.calls[1][1] as RequestInit).headers).not.toHaveProperty(IF_MATCH);
  });
});
