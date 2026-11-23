import { ActionType, PromptPublication, PublicationStatus } from '@/src/models/dial/publications';
import { EnrichmentClients } from '@/src/server/publications/resolver/types';
import { CORE_TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { CorePublicationsApi } from '../core-publications-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

const sentRequest = (index = 0): Request => fetch.mock.calls[index][0] as Request;
const sentBody = async (index = 0): Promise<Record<string, unknown>> =>
  JSON.parse(await sentRequest(index).clone().text());

/** A Core-issued path: the space is `%20`, the literal `%` is `%25`, and it carries a `/`. */
const CORE_ISSUED_PATH = 'public/My%20Folder/req%2520__1';

const makeClients = (): EnrichmentClients => ({
  getAsset: vi.fn(),
  updateAsset: vi.fn(),
  getBucket: vi.fn(),
  getSkillMetadata: vi.fn(),
  getProjectMetadata: vi.fn(),
  getFileMetadata: vi.fn(),
  uploadFile: vi.fn(),
});

describe('Server :: CorePublicationsApi', () => {
  let clients: EnrichmentClients;
  let instance: CorePublicationsApi;

  beforeEach(() => {
    fetch.resetMocks();
    clients = makeClients();
    instance = new CorePublicationsApi({ host: CORE_TEST_URL }, clients);
  });

  test('getPublicationList posts the public path and tags every publication with its resource type', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        publications: [
          { url: 'publications/public/p1', name: 'Prompt 1', resourceTypes: ['PROMPT'], status: 'PENDING' },
          { url: 'publications/public/s1', name: 'Skill 1', resourceTypes: ['SKILL'], status: 'PENDING' },
          { url: 'publications/public/u1', name: 'Untyped', resourceTypes: [], status: 'PENDING' },
          { name: 'No url', resourceTypes: ['PROMPT'], status: 'PENDING' },
          { url: 'publications/public/ns', name: 'No status', resourceTypes: ['PROMPT'] },
        ],
      }),
      JSON_HEADERS,
    );

    const result = await instance.getPublicationList(TOKEN_MOCK);

    expect(sentRequest().url).toBe('http://core.test/v1/ops/publication/list');
    expect(sentRequest().method).toBe('POST');
    expect(sentRequest().headers.get('authorization')).toBe('Bearer access_token_mock');
    expect(await sentBody()).toEqual({ url: 'publications/public/' });
    expect(result).toHaveLength(2);
    expect(result?.[0]).toMatchObject({ path: 'public/p1', requestName: 'Prompt 1', resourceType: 'PROMPT' });
    expect(result?.[1]).toMatchObject({ path: 'public/s1', requestName: 'Skill 1', resourceType: 'SKILL' });
  });

  test('getPublicationList reads the { publications } object, so a bare array yields no publications', async () => {
    fetch.mockResponseOnce(
      JSON.stringify([{ url: 'publications/public/p1', resourceTypes: ['PROMPT'], status: 'PENDING' }]),
      JSON_HEADERS,
    );

    expect(await instance.getPublicationList(TOKEN_MOCK)).toEqual([]);
  });

  test.each([
    ['getPublicationList', (api: CorePublicationsApi) => api.getPublicationList(TOKEN_MOCK)],
    ['getPublication', (api: CorePublicationsApi) => api.getPublication(TOKEN_MOCK, 'public/req')],
  ])('%s resolves to undefined on 403 and to null on any other failure', async (_, call) => {
    fetch.mockResponseOnce('forbidden', { status: 403 });
    expect(await call(instance)).toBeUndefined();

    fetch.mockResponseOnce('boom', { status: 500 });
    expect(await call(instance)).toBeNull();

    fetch.mockResponseOnce('missing', { status: 404 });
    expect(await call(instance)).toBeNull();
  });

  test.each(['APPROVED', 'REJECTED'])('getPublication returns null for %s publications', async (status) => {
    fetch.mockResponseOnce(JSON.stringify({ url: 'publications/x', status }), JSON_HEADERS);

    expect(await instance.getPublication(TOKEN_MOCK, 'x')).toBeNull();
  });

  test('getPublication returns null for a publication Core sent without a status', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: 'publications/x', resourceTypes: ['PROMPT'] }), JSON_HEADERS);

    expect(await instance.getPublication(TOKEN_MOCK, 'x')).toBeNull();
  });

  test('getPublication sends a Core-issued path unchanged', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: 'publications/x', status: 'APPROVED' }), JSON_HEADERS);

    await instance.getPublication(TOKEN_MOCK, CORE_ISSUED_PATH);

    expect(sentRequest().url).toBe('http://core.test/v1/ops/publication/get');
    expect(await sentBody()).toEqual({ url: `publications/${CORE_ISSUED_PATH}` });
  });

  test('getPublication enriches a pending prompt publication', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        url: 'publications/public/req',
        name: 'My request',
        targetFolder: 'public/folder',
        status: PublicationStatus.PENDING,
        resourceTypes: ['PROMPT'],
        resources: [
          {
            action: 'ADD',
            sourceUrl: 'prompts/src/P__1',
            reviewUrl: 'prompts/review/P__1',
            targetUrl: 'prompts/public/P__1',
          },
        ],
      }),
      JSON_HEADERS,
    );
    // target (public/...) does not exist; the review copy resolves to the prompt body
    (clients.getAsset as ReturnType<typeof vi.fn>).mockImplementation((_t, path: string) =>
      path.startsWith('public')
        ? Promise.resolve({ success: false })
        : Promise.resolve({ success: true, response: { name: 'P', content: 'body' } }),
    );

    const result = (await instance.getPublication(TOKEN_MOCK, 'public/req')) as PromptPublication;

    expect(result.path).toBe('public/req');
    expect(result.action).toBe(ActionType.ADD);
    expect(result.resourceIssues).toEqual([]);
    expect((result.prompts as { prompt: unknown }[])[0].prompt).toEqual({ name: 'P', content: 'body' });
  });

  test('getPublication records an issue when the resource is missing', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        url: 'publications/public/req',
        status: PublicationStatus.PENDING,
        resourceTypes: ['PROMPT'],
        resources: [{ action: 'ADD', reviewUrl: 'prompts/review/P__1', targetUrl: 'prompts/public/P__1' }],
      }),
      JSON_HEADERS,
    );
    (clients.getAsset as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });

    const result = (await instance.getPublication(TOKEN_MOCK, 'public/req')) as PromptPublication;

    expect(result.prompts).toEqual([]);
    expect(result.resourceIssues).toEqual([
      { resourceType: 'PROMPT', path: 'review/P__1', message: 'Prompt not found' },
    ]);
  });

  test('declinePublication sanitizes the comment and posts to reject', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.declinePublication(TOKEN_MOCK, 'p/1', 'No <b>good</b>');

    expect(sentRequest().url).toBe('http://core.test/v1/ops/publication/reject');
    expect(await sentBody()).toEqual({ url: 'publications/p/1', comment: 'No good' });
  });

  test.each([
    [
      'approvePublication',
      'approve',
      (api: CorePublicationsApi, path: string) => api.approvePublication(TOKEN_MOCK, path),
    ],
    [
      'declinePublication',
      'reject',
      (api: CorePublicationsApi, path: string) => api.declinePublication(TOKEN_MOCK, path),
    ],
    [
      'deletePublication',
      'delete',
      (api: CorePublicationsApi, path: string) => api.deletePublication(TOKEN_MOCK, path),
    ],
  ])('%s sends a Core-issued path with a slash, a space and a percent unchanged', async (_, operation, call) => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await call(instance, CORE_ISSUED_PATH);

    expect(sentRequest().url).toBe(`http://core.test/v1/ops/publication/${operation}`);
    expect((await sentBody()).url).toBe(`publications/${CORE_ISSUED_PATH}`);
  });

  describe.each([
    ['approvePublication', (api: CorePublicationsApi) => api.approvePublication(TOKEN_MOCK, 'p/1')],
    ['declinePublication', (api: CorePublicationsApi) => api.declinePublication(TOKEN_MOCK, 'p/1')],
    ['deletePublication', (api: CorePublicationsApi) => api.deletePublication(TOKEN_MOCK, 'p/1')],
  ])('%s envelope', (_, call) => {
    test('resolves as a success on an empty 200 body', async () => {
      fetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      expect(await call(instance)).toEqual({ success: true, response: '', etag: undefined });
    });

    test('resolves as a success on a 204', async () => {
      fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      expect(await call(instance)).toEqual({ success: true, response: '', etag: undefined });
    });

    test('resolves as a failure with the status and message on a plain-text 403', async () => {
      fetch.mockResponseOnce('Access denied', { status: 403, headers: { 'content-type': 'text/plain' } });

      expect(await call(instance)).toMatchObject({ success: false, status: 403, errorMessage: 'Access denied' });
    });
  });

  test('createPublication sends the target folder, resources and rules as given', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: 'publications/public/My%20Folder/' }), JSON_HEADERS);

    const result = await instance.createPublication(
      TOKEN_MOCK,
      'public/My%20Folder/',
      [{ action: 'DELETE', targetUrl: 'prompts/public/My%20Folder/p__1' }],
      [{ source: 'title', function: 'EQUAL', targets: ['x'] }],
    );

    expect(sentRequest().url).toBe('http://core.test/v1/ops/publication/create');
    expect(await sentBody()).toEqual({
      targetFolder: 'public/My%20Folder/',
      resources: [{ action: 'DELETE', targetUrl: 'prompts/public/My%20Folder/p__1' }],
      rules: [{ source: 'title', function: 'EQUAL', targets: ['x'] }],
    });
    expect(result).toMatchObject({ success: true, response: { url: 'publications/public/My%20Folder/' } });
  });

  test('a created publication is approved by the path left after its returned url prefix', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: 'publications/public/My%20Folder/' }), JSON_HEADERS);
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.createPublication(TOKEN_MOCK, 'public/My%20Folder/', []);
    await instance.approvePublication(TOKEN_MOCK, 'public/My%20Folder/');

    expect(sentRequest(1).url).toBe('http://core.test/v1/ops/publication/approve');
    expect(await sentBody(1)).toEqual({ url: 'publications/public/My%20Folder/' });
  });

  test('ruleList encodes a typed folder per segment with a trailing slash', async () => {
    fetch.mockResponseOnce(JSON.stringify({ rules: {} }), JSON_HEADERS);

    await instance.ruleList(TOKEN_MOCK, 'My Folder/100%');

    expect(sentRequest().url).toBe('http://core.test/v1/ops/publication/rule/list');
    expect(await sentBody()).toEqual({ url: 'My%20Folder/100%25/' });
  });

  test('ruleList returns the rules exactly as Core sent them', async () => {
    const rules = {
      'public/folder/': [
        { source: 'title', function: 'UNKNOWN_FN', targets: ['x'] },
        { source: 'role', function: 'EQUAL' },
      ],
    };
    fetch.mockResponseOnce(JSON.stringify({ rules }), JSON_HEADERS);

    const result = await instance.ruleList(TOKEN_MOCK, 'public/folder/');

    expect(result.success).toBe(true);
    expect(result.response?.rules).toEqual(rules);
  });

  test('updatePublication recalculates targets, posts the dto, and PUTs each resource', async () => {
    fetch.mockResponse(JSON.stringify({ success: true }));
    (clients.updateAsset as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

    const publication = {
      path: CORE_ISSUED_PATH,
      requestName: 'My request',
      folderId: 'public/folder',
      displayAuthor: 'Ann',
      rules: [],
      prompts: [
        {
          action: ActionType.ADD,
          sourceUrl: 'prompts/src/P__1',
          targetUrl: 'prompts/old/P__1',
          reviewUrl: 'prompts/review/P__1',
          // A prompt's target is its folder + plain name — the `__1` stays part of the name.
          prompt: { name: 'P__1', content: 'body' },
        },
      ],
    };
    const formData = new FormData();
    formData.append('publication', new Blob([JSON.stringify(publication)], { type: 'application/json' }));

    const result = await instance.updatePublication(TOKEN_MOCK, formData);

    expect(result.success).toBe(true);
    expect(sentRequest().url).toBe('http://core.test/v1/ops/publication/update');
    const dto = await sentBody();
    expect(dto).toEqual({
      url: `publications/${CORE_ISSUED_PATH}`,
      name: 'My request',
      targetFolder: 'public/folder/',
      resources: [{ action: 'ADD', sourceUrl: 'prompts/src/P__1', targetUrl: 'prompts/public/folder/P__1' }],
      resourceTypes: ['PROMPT'],
      rules: [],
      displayAuthor: 'Ann',
    });
    expect(dto).not.toHaveProperty('publishCredentials');
    expect(clients.updateAsset).toHaveBeenCalledOnce();
  });
});
