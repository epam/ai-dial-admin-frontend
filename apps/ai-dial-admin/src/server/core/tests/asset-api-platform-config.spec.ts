import { CORE_TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { IF_MATCH, IF_NONE_MATCH } from '@/src/constants/api-headers';
import { ResourceType } from '@/src/types/resource-type';
import { AssetApi } from '../asset-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { 'content-type': 'application/json' };

/**
 * The nine flat platform-bucket types moved onto the SDK together, and `POLICY` is the type that is still read by the
 * hand-written client (until umbrella PR 3). For the same name a request differs from a policy request only by the
 * `{segment}` of the prefix, so the hand-written request is the reference an SDK request has to equal: a change in how
 * the SDK treats a path then fails here instead of reaching Core as a different URL. `POLICY` has one folder level; the
 * comparison covers only the URL, so that does not matter here.
 */
const REFERENCE_TYPE = ResourceType.POLICY;
const REFERENCE_SEGMENT = 'policies';

/** [label, type, the URL segment of its `RESOURCE_TYPE_PREFIX`] */
const TYPES: Array<[string, ResourceType, string]> = [
  ['router', ResourceType.ROUTER, 'routers'],
  ['role', ResourceType.ROLE, 'roles'],
  ['route', ResourceType.ROUTE, 'routes'],
  ['project key', ResourceType.PROJECT_KEY, 'keys'],
  ['interceptor', ResourceType.INTERCEPTOR, 'interceptors'],
  ['translator', ResourceType.TRANSLATOR, 'translators'],
  ['plugin', ResourceType.PLUGIN, 'plugins'],
  ['application type schema', ResourceType.APP_TYPE_SCHEMA, 'schemas'],
  ['catalog schema', ResourceType.CATALOG_SCHEMA, 'catalog_schemas'],
];

/** The SDK hands `fetch` a `Request`; the hand-written client hands it a URL string. */
const sentCall = (index: number): unknown => fetch.mock.calls[index][0] as unknown;
const isSdkRequest = (index: number): boolean => typeof sentCall(index) !== 'string';
const sentRequest = (index = 0): Request => sentCall(index) as Request;
const sentBody = (index = 0): Promise<string> => sentRequest(index).clone().text();
const urlOf = (index: number): string => {
  const sent = sentCall(index);
  return typeof sent === 'string' ? sent : (sent as Request).url;
};
const asReferenceUrl = (url: string, segment: string): string =>
  url.replace(`/${segment}/platform/`, `/${REFERENCE_SEGMENT}/platform/`);

const instance = new AssetApi({ host: CORE_TEST_URL });

/**
 * Runs `read` for the reference type, then for `type`, and returns both URLs in the reference's terms. It fails when the
 * reference request is no longer hand-written (once `POLICY` is migrated): the comparison would then be between two SDK
 * requests and prove nothing.
 */
const readPair = async (type: ResourceType, segment: string, read: (type: ResourceType) => Promise<unknown>) => {
  // `mockResponse` persists across calls: reset here so each pair starts from an empty call log and urlOf(0) / urlOf(1)
  // are the pair's own requests, whatever ran before in the same test.
  fetch.resetMocks();
  fetch.mockResponse('{}', { headers: JSON_HEADERS });
  await read(REFERENCE_TYPE);
  await read(type);
  expect(isSdkRequest(0)).toBe(false);
  return {
    reference: urlOf(0),
    sdk: asReferenceUrl(urlOf(1), segment),
    isSdkBacked: isSdkRequest(1),
  };
};

describe.each(TYPES)('Server :: Core :: AssetApi :: %s through the SDK', (_label, type, segment) => {
  const resourceUrl = `${CORE_TEST_URL}v1/${segment}/platform/my-res`;
  const metadataUrl = `${CORE_TEST_URL}v1/metadata/${segment}/platform`;

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getContent reads /v1/{type}/platform/{name} with the caller token', async () => {
    fetch.mockResponseOnce(JSON.stringify({ a: 1 }), { headers: JSON_HEADERS });

    const content = await instance.getContent(TOKEN_MOCK, type, 'my-res');

    expect(content).toEqual({ a: 1 });
    expect(sentRequest().method).toBe('GET');
    expect(sentRequest().url).toBe(resourceUrl);
    expect(sentRequest().headers.get('authorization')).toBe('Bearer access_token_mock');
  });

  test('getContent sends If-None-Match only for a real etag', async () => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });
    await instance.getContent(TOKEN_MOCK, type, 'my-res', '"e1"');
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });
    await instance.getContent(TOKEN_MOCK, type, 'my-res', '*');

    expect(sentRequest(0).headers.get(IF_NONE_MATCH)).toBe('"e1"');
    expect(sentRequest(1).headers.has(IF_NONE_MATCH)).toBe(false);
  });

  test('getMetadata of one resource asks for the item, non-recursively', async () => {
    fetch.mockResponseOnce(JSON.stringify({ name: 'my-res', nodeType: 'ITEM' }), { headers: JSON_HEADERS });

    await instance.getMetadata(TOKEN_MOCK, type, 'my-res');

    expect(sentRequest().method).toBe('GET');
    expect(sentRequest().url).toBe(`${metadataUrl}/my-res?recursive=false`);
  });

  test.each(['', 'platform/'])('getMetadata lists the bucket root for the path "%s"', async (path) => {
    fetch.mockResponseOnce(JSON.stringify({ name: '', nodeType: 'FOLDER', items: [] }), { headers: JSON_HEADERS });

    await instance.getMetadata(TOKEN_MOCK, type, path, { recursive: true, nextToken: 'page-2' });

    expect(sentRequest().url).toBe(`${metadataUrl}/?recursive=true&token=page-2`);
  });

  test('put without an etag or override creates with If-None-Match: * and sends the body as given', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: `${segment}/platform/my-res` }), { headers: JSON_HEADERS });

    const result = await instance.put(TOKEN_MOCK, type, 'my-res', { a: 1, nested: { b: [1, 2] } });

    expect(result.success).toBe(true);
    expect(sentRequest().method).toBe('PUT');
    expect(sentRequest().url).toBe(resourceUrl);
    expect(sentRequest().headers.get(IF_NONE_MATCH)).toBe('*');
    expect(JSON.parse(await sentBody())).toEqual({ a: 1, nested: { b: [1, 2] } });
  });

  test('put with an etag sends If-Match and no If-None-Match', async () => {
    fetch.mockResponseOnce('{}', { headers: JSON_HEADERS });

    await instance.put(TOKEN_MOCK, type, 'my-res', { a: 1 }, { etag: '"e1"' });

    expect(sentRequest().headers.get(IF_MATCH)).toBe('"e1"');
    expect(sentRequest().headers.has(IF_NONE_MATCH)).toBe(false);
  });

  test('put grafts the admin-format path fields onto a successful response', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: `${segment}/platform/my-res` }), { headers: JSON_HEADERS });

    const result = await instance.put(TOKEN_MOCK, type, 'my-res', { a: 1 });

    expect(result.response).toEqual({
      url: `${segment}/platform/my-res`,
      _metadata: { path: 'my-res', folderId: '', name: 'my-res' },
    });
  });

  test.each([200, 204])('delete sends DELETE with If-Match and resolves to the empty text for a %i', async (status) => {
    fetch.mockResolvedValueOnce(new Response(null, { status }));

    const result = await instance.delete(TOKEN_MOCK, type, 'my-res', '"e2"');

    expect(result).toEqual({ success: true, response: '', etag: undefined });
    expect(sentRequest().method).toBe('DELETE');
    expect(sentRequest().url).toBe(resourceUrl);
    expect(sentRequest().headers.get(IF_MATCH)).toBe('"e2"');
  });

  test('getMergedWithEtag takes the etag from the metadata node, not the content response', async () => {
    fetch.mockResponseOnce(JSON.stringify({ a: 1 }), { headers: { ...JSON_HEADERS, etag: '"content-etag"' } });
    fetch.mockResponseOnce(
      JSON.stringify({ name: 'my-res', nodeType: 'ITEM', url: `${segment}/platform/my-res`, etag: 'meta-etag-1' }),
      { headers: JSON_HEADERS },
    );

    const result = await instance.getMergedWithEtag(TOKEN_MOCK, type, 'my-res');

    expect(result.success).toBe(true);
    expect(result.etag).toBe('meta-etag-1');
    expect(sentRequest(0).url).toBe(resourceUrl);
    expect(sentRequest(1).url).toBe(`${metadataUrl}/my-res?recursive=false`);
  });

  test.each([
    [403, undefined],
    [404, null],
    [500, null],
  ])('a content or metadata read answered with %i resolves to %s', async (status, expected) => {
    fetch.mockResponseOnce('no', { status });
    fetch.mockResponseOnce('no', { status });

    expect(await instance.getContent(TOKEN_MOCK, type, 'my-res')).toBe(expected);
    expect(await instance.getMetadata(TOKEN_MOCK, type, 'my-res')).toBe(expected);
  });

  test.each([
    ['content get', (t: ResourceType) => instance.getContent(TOKEN_MOCK, t, 'my-res')],
    ['metadata get', (t: ResourceType) => instance.getMetadata(TOKEN_MOCK, t, 'my-res')],
    ['root listing', (t: ResourceType) => instance.getMetadata(TOKEN_MOCK, t, '', { recursive: true, limit: 50 })],
    ['save', (t: ResourceType) => instance.put(TOKEN_MOCK, t, 'my-res', { a: 1 })],
    ['delete', (t: ResourceType) => instance.delete(TOKEN_MOCK, t, 'my-res')],
  ])('the %s request URL equals the hand-written client URL of the reference type', async (_verb, read) => {
    const { reference, sdk, isSdkBacked } = await readPair(type, segment, read);

    expect(isSdkBacked).toBe(true);
    expect(sdk).toBe(reference);
  });
});

describe('Server :: Core :: AssetApi :: platform configuration path encoding', () => {
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

  beforeEach(() => {
    fetch.resetMocks();
  });

  test.each(NAMES)('a role content get with %s equals the hand-written URL', async (_, name) => {
    const { reference, sdk, isSdkBacked } = await readPair(ResourceType.ROLE, 'roles', (type) =>
      instance.getContent(TOKEN_MOCK, type, name),
    );

    expect(isSdkBacked).toBe(true);
    expect(sdk).toBe(reference);
  });

  test.each(NAMES)('a role metadata get with %s equals the hand-written URL', async (_, name) => {
    const { reference, sdk, isSdkBacked } = await readPair(ResourceType.ROLE, 'roles', (type) =>
      instance.getMetadata(TOKEN_MOCK, type, name),
    );

    expect(isSdkBacked).toBe(true);
    expect(sdk).toBe(reference);
  });

  test.each(NAMES)('a role save with %s equals the hand-written URL', async (_, name) => {
    const { reference, sdk, isSdkBacked } = await readPair(ResourceType.ROLE, 'roles', (type) =>
      instance.put(TOKEN_MOCK, type, name, { a: 1 }),
    );

    expect(isSdkBacked).toBe(true);
    expect(sdk).toBe(reference);
  });

  test.each(NAMES)('a role delete with %s equals the hand-written URL', async (_, name) => {
    const { reference, sdk, isSdkBacked } = await readPair(ResourceType.ROLE, 'roles', (type) =>
      instance.delete(TOKEN_MOCK, type, name),
    );

    expect(isSdkBacked).toBe(true);
    expect(sdk).toBe(reference);
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

    await instance.getContent(TOKEN_MOCK, ResourceType.ROLE, name);

    expect(urlOf(0)).toBe(`${CORE_TEST_URL}v1/roles/platform/${encoded}`);
  });

  test('an application type schema named by an already-encoded $id reaches Core with every layer kept', async () => {
    const name = 'https%3A%2F%2Fhost%2Fcustom_application_schemas%2Fchart';
    const encoded = 'https%253A%252F%252Fhost%252Fcustom_application_schemas%252Fchart';
    fetch.mockResponse('{}', { headers: JSON_HEADERS });

    await instance.getContent(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, name);
    await instance.getMetadata(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, name);
    await instance.put(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, name, { $id: name });
    await instance.delete(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, name);

    expect(urlOf(0)).toBe(`${CORE_TEST_URL}v1/schemas/platform/${encoded}`);
    expect(urlOf(1)).toBe(`${CORE_TEST_URL}v1/metadata/schemas/platform/${encoded}?recursive=false`);
    expect(urlOf(2)).toBe(`${CORE_TEST_URL}v1/schemas/platform/${encoded}`);
    expect(urlOf(3)).toBe(`${CORE_TEST_URL}v1/schemas/platform/${encoded}`);
  });

  test('a project key named with a space reaches Core percent-encoded', async () => {
    fetch.mockResponse('{}', { headers: JSON_HEADERS });

    await instance.getContent(TOKEN_MOCK, ResourceType.PROJECT_KEY, 'team key');
    await instance.delete(TOKEN_MOCK, ResourceType.PROJECT_KEY, 'team key');

    expect(urlOf(0)).toBe(`${CORE_TEST_URL}v1/keys/platform/team%20key`);
    expect(urlOf(1)).toBe(`${CORE_TEST_URL}v1/keys/platform/team%20key`);
  });

  test('a content, save or delete path that begins with platform/ keeps that segment', async () => {
    fetch.mockResponse('{}', { headers: JSON_HEADERS });

    await instance.getContent(TOKEN_MOCK, ResourceType.ROLE, 'platform/x');
    await instance.put(TOKEN_MOCK, ResourceType.ROLE, 'platform/x', { a: 1 });
    await instance.delete(TOKEN_MOCK, ResourceType.ROLE, 'platform/x');

    expect([0, 1, 2].map(urlOf)).toEqual(Array(3).fill(`${CORE_TEST_URL}v1/roles/platform/platform/x`));
  });

  test('only the metadata read strips a leading platform/', async () => {
    const { reference, sdk } = await readPair(ResourceType.ROLE, 'roles', (type) =>
      instance.getMetadata(TOKEN_MOCK, type, 'platform/x'),
    );

    expect(sdk).toBe(reference);
    expect(sdk).toBe(`${CORE_TEST_URL}v1/metadata/policies/platform/x?recursive=false`);
  });

  test.each([
    ['an empty path (the root listing)', ''],
    ['platform/ (the root, as a folder tree sends it)', 'platform/'],
    ['a folder path ending in a slash', 'x/'],
  ])('a role metadata get with %s equals the hand-written URL', async (_, path) => {
    const { reference, sdk } = await readPair(ResourceType.ROLE, 'roles', (type) =>
      instance.getMetadata(TOKEN_MOCK, type, path),
    );

    expect(sdk).toBe(reference);
  });

  test('the metadata query keeps its order and is byte-identical for a token of + / = and non-ASCII', async () => {
    const options = { recursive: true, nextToken: 'ab+/=é', limit: 50 };
    const { reference, sdk } = await readPair(ResourceType.ROLE, 'roles', (type) =>
      instance.getMetadata(TOKEN_MOCK, type, 'x/', options),
    );

    expect(sdk).toBe(reference);
    expect(sdk).toBe(
      `${CORE_TEST_URL}v1/metadata/policies/platform/x/?recursive=true&token=ab%2B%2F%3D%C3%A9&limit=50`,
    );
  });
});

describe('Server :: Core :: AssetApi :: platform configuration endpoints', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('a router is read at /v1/routers/platform/{name}, never at the name-only /v1/routers/{name}', async () => {
    fetch.mockResponse('{}', { headers: JSON_HEADERS });

    await instance.getContent(TOKEN_MOCK, ResourceType.ROUTER, 'my-router');
    await instance.getMetadata(TOKEN_MOCK, ResourceType.ROUTER, 'my-router');

    expect(urlOf(0)).toBe(`${CORE_TEST_URL}v1/routers/platform/my-router`);
    expect(urlOf(1)).toBe(`${CORE_TEST_URL}v1/metadata/routers/platform/my-router?recursive=false`);
  });

  test('an application type schema is written with every field the caller sent, none added or dropped', async () => {
    const body = {
      $id: 'https://host/custom_application_schemas/chart',
      'dial:applicationTypeEditorUrl': 'https://host/editor',
      'x-unlisted': { deep: [1, { two: 2 }] },
    };
    fetch.mockResponse('{}', { headers: JSON_HEADERS });

    await instance.put(TOKEN_MOCK, ResourceType.APP_TYPE_SCHEMA, 'chart', body);

    expect(JSON.parse(await sentBody())).toEqual(body);
  });
});
