import { CORE_TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { ResourceType } from '@/src/types/resource-type';
import { AssetApi } from '../asset-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { 'content-type': 'application/json' };

/**
 * `MODEL` goes through the SDK and `ROLE` still goes through the hand-written client, and both are flat platform
 * types, so for the same name their requests differ only by the `models` / `roles` prefix. That makes the
 * hand-written request the reference an SDK request has to equal: a change in how the SDK treats a path then fails
 * here instead of reaching Core as a different URL. Each later migration moves the reference to a type still on
 * the hand-written client.
 */
const urlOf = (index: number): string => {
  const sent = fetch.mock.calls[index][0] as unknown;
  return typeof sent === 'string' ? sent : (sent as Request).url;
};
const asModelUrl = (roleUrl: string): string => roleUrl.replace('/roles/', '/models/');

const NAMES: Array<[string, string]> = [
  ['a plain name', 'gpt-4'],
  ['a percent sign', '100%'],
  ['a plus sign', 'a+b'],
  ['a query and a fragment delimiter', 'q?x#y'],
  ['an existing percent escape', 'm%20n'],
  ['a space', 'my model'],
  ['non-ASCII letters', 'modèle-é'],
  ['a nested path', 'a b/c d'],
  ['a reserved sub-delimiter set', 'a;b,c[1]'],
];

describe('Server :: Core :: AssetApi :: request paths equal the hand-written client', () => {
  const instance = new AssetApi({ host: CORE_TEST_URL });

  const readPair = async (read: (type: ResourceType) => Promise<unknown>) => {
    // `mockResponse` persists across calls: reset here so each pair starts from an empty call log and urlOf(0) / urlOf(1)
    // are the pair's own requests, whatever ran before in the same test.
    fetch.resetMocks();
    fetch.mockResponse('{}', { headers: JSON_HEADERS });
    await read(ResourceType.ROLE);
    await read(ResourceType.MODEL);
    return { handWritten: asModelUrl(urlOf(0)), sdk: urlOf(1) };
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test.each(NAMES)('content get with %s', async (_, name) => {
    const { handWritten, sdk } = await readPair((type) => instance.getContent(TOKEN_MOCK, type, name));

    expect(sdk).toBe(handWritten);
  });

  test.each(NAMES)('metadata get with %s', async (_, name) => {
    const { handWritten, sdk } = await readPair((type) => instance.getMetadata(TOKEN_MOCK, type, name));

    expect(sdk).toBe(handWritten);
  });

  test.each(NAMES)('save with %s', async (_, name) => {
    const { handWritten, sdk } = await readPair((type) => instance.put(TOKEN_MOCK, type, name, { a: 1 }));

    expect(sdk).toBe(handWritten);
  });

  test.each(NAMES)('delete with %s', async (_, name) => {
    const { handWritten, sdk } = await readPair((type) => instance.delete(TOKEN_MOCK, type, name));

    expect(sdk).toBe(handWritten);
  });

  test.each([
    ['100%', '100%25'],
    ['a+b', 'a%2Bb'],
    ['q?x#y', 'q%3Fx%23y'],
    ['m%20n', 'm%2520n'],
    ['my model', 'my%20model'],
    ['a b/c d', 'a%20b/c%20d'],
  ])('the name %s reaches Core as %s', async (name, encoded) => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });

    await instance.getContent(TOKEN_MOCK, ResourceType.MODEL, name);

    expect(urlOf(0)).toBe(`${CORE_TEST_URL}v1/models/platform/${encoded}`);
  });

  test('a content, save or delete path that begins with platform/ keeps that segment', async () => {
    const { handWritten, sdk } = await readPair((type) => instance.getContent(TOKEN_MOCK, type, 'platform/x'));

    expect(sdk).toBe(handWritten);
    expect(sdk).toBe(`${CORE_TEST_URL}v1/models/platform/platform/x`);
  });

  test('only the metadata read strips a leading platform/', async () => {
    const { handWritten, sdk } = await readPair((type) => instance.getMetadata(TOKEN_MOCK, type, 'platform/x'));

    expect(sdk).toBe(handWritten);
    expect(sdk).toBe(`${CORE_TEST_URL}v1/metadata/models/platform/x?recursive=false`);
  });

  test.each([
    ['an empty path (the root listing)', ''],
    ['platform/ (the root, as a folder tree sends it)', 'platform/'],
    ['a folder path ending in a slash', 'x/'],
  ])('metadata get with %s', async (_, path) => {
    const { handWritten, sdk } = await readPair((type) => instance.getMetadata(TOKEN_MOCK, type, path));

    expect(sdk).toBe(handWritten);
  });

  test('the metadata query keeps its order and is byte-identical for a token of + / = and non-ASCII', async () => {
    const options = { recursive: true, nextToken: 'ab+/=é', limit: 50 };
    const { handWritten, sdk } = await readPair((type) => instance.getMetadata(TOKEN_MOCK, type, 'x/', options));

    expect(sdk).toBe(handWritten);
    expect(sdk).toBe(`${CORE_TEST_URL}v1/metadata/models/platform/x/?recursive=true&token=ab%2B%2F%3D%C3%A9&limit=50`);
  });

  test("a token with a space or ~ ! ' ( ) is encoded differently by the SDK but decodes to the same value", async () => {
    const token = "a b~!'()*&?#";
    const { handWritten, sdk } = await readPair((type) =>
      instance.getMetadata(TOKEN_MOCK, type, '', { nextToken: token }),
    );

    expect(new URL(sdk).searchParams.get('token')).toBe(token);
    expect(new URL(handWritten).searchParams.get('token')).toBe(token);
    expect([...new URL(sdk).searchParams.keys()]).toEqual([...new URL(handWritten).searchParams.keys()]);
  });
});

describe('Server :: Core :: AssetApi :: a 304 on a conditional read', () => {
  const instance = new AssetApi({ host: CORE_TEST_URL });
  const notModified = () => new Response(null, { status: 304, headers: { etag: '"e1"', traceparent: 'trace-304' } });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getMergedWithEtag fails the same way through the SDK and the hand-written client', async () => {
    fetch.mockResolvedValueOnce(notModified());
    const handWritten = await instance.getMergedWithEtag(TOKEN_MOCK, ResourceType.ROLE, 'r', '"e1"');
    fetch.mockResolvedValueOnce(notModified());
    const sdk = await instance.getMergedWithEtag(TOKEN_MOCK, ResourceType.MODEL, 'm', '"e1"');

    expect(sdk).toEqual(handWritten);
    expect(sdk).toEqual({
      success: false,
      status: 304,
      etag: '"e1"',
      requestId: 'trace-304',
      errorMessage: 'Error status: 304',
      errorHeader: 'Request error',
    });
    expect(fetch.mock.calls).toHaveLength(2);
  });

  test('getContent with an etag resolves null through the SDK and the hand-written client', async () => {
    fetch.mockResolvedValueOnce(notModified());
    const handWritten = await instance.getContent(TOKEN_MOCK, ResourceType.ROLE, 'r', '"e1"');
    fetch.mockResolvedValueOnce(notModified());
    const sdk = await instance.getContent(TOKEN_MOCK, ResourceType.MODEL, 'm', '"e1"');

    expect(handWritten).toBeNull();
    expect(sdk).toBeNull();
  });
});
