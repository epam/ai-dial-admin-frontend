import { ActionType, PublicationStatus } from '@/src/models/dial/publications';
import { EnrichmentClients } from '@/src/server/publications/resolver/types';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { CorePublicationsApi } from '../core-publications-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

const makeClients = (): EnrichmentClients => ({
  getAsset: vi.fn(),
  updateAsset: vi.fn(),
  getBucket: vi.fn(),
  getFileMetadata: vi.fn(),
  uploadFile: vi.fn(),
});

describe('Server :: CorePublicationsApi', () => {
  let clients: EnrichmentClients;
  let instance: CorePublicationsApi;

  beforeEach(() => {
    fetch.resetMocks();
    clients = makeClients();
    instance = new CorePublicationsApi({ host: TEST_URL }, clients);
  });

  test('list posts the public path and filters/maps by resource type', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({
        publications: [
          { url: 'publications/public/p1', name: 'Prompt 1', resourceTypes: ['PROMPT'], status: 'PENDING' },
          { url: 'publications/public/f1', name: 'File 1', resourceTypes: ['FILE'], status: 'PENDING' },
        ],
      }),
      JSON_HEADERS,
    );

    const result = await instance.getPublicationPromptList(TOKEN_MOCK);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain('/v1/ops/publication/list');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ url: 'publications/public/' });
    expect(result).toHaveLength(1);
    expect(result?.[0]).toMatchObject({ path: 'public/p1', requestName: 'Prompt 1' });
  });

  test('getPublication returns null for APPROVED publications', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: 'publications/x', status: 'APPROVED' }), JSON_HEADERS);

    const result = await instance.getPublication(TOKEN_MOCK, 'x');

    expect(result).toBeNull();
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
        : Promise.resolve({ success: true, response: { name: 'P', version: '1', content: 'body' } }),
    );

    const result = (await instance.getPublication(TOKEN_MOCK, 'public/req')) as Record<string, unknown>;

    expect(result.path).toBe('public/req');
    expect(result.action).toBe(ActionType.ADD);
    expect(result.resourceIssues).toEqual([]);
    expect((result.prompts as { prompt: unknown }[])[0].prompt).toEqual({ name: 'P', version: '1', content: 'body' });
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

    const result = (await instance.getPublication(TOKEN_MOCK, 'public/req')) as Record<string, unknown>;

    expect(result.prompts).toEqual([]);
    expect(result.resourceIssues).toEqual([
      { resourceType: 'PROMPT', path: 'review/P__1', message: 'Prompt not found' },
    ]);
  });

  test('declinePublication sanitizes the comment and posts to reject', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    await instance.declinePublication(TOKEN_MOCK, 'p/1', 'No <b>good</b>');

    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain('/v1/ops/publication/reject');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      url: 'publications/p/1',
      comment: 'No good',
    });
  });

  test('approvePublication / deletePublication post the prefixed path', async () => {
    fetch.mockResponse(JSON.stringify({ success: true }));

    await instance.approvePublication(TOKEN_MOCK, 'p/1');
    await instance.deletePublication(TOKEN_MOCK, 'p/2');

    expect(fetch.mock.calls[0][0]).toContain('/v1/ops/publication/approve');
    expect(JSON.parse((fetch.mock.calls[0][1] as RequestInit).body as string)).toEqual({ url: 'publications/p/1' });
    expect(fetch.mock.calls[1][0]).toContain('/v1/ops/publication/delete');
    expect(JSON.parse((fetch.mock.calls[1][1] as RequestInit).body as string)).toEqual({ url: 'publications/p/2' });
  });

  test('updatePublication recalculates targets, posts the dto, and PUTs each resource', async () => {
    fetch.mockResponse(JSON.stringify({ success: true }));
    (clients.updateAsset as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

    const publication = {
      path: 'public/req',
      requestName: 'My request',
      folderId: 'public/folder',
      rules: [],
      prompts: [
        {
          action: ActionType.ADD,
          sourceUrl: 'prompts/src/P__1',
          targetUrl: 'prompts/old/P__1',
          reviewUrl: 'prompts/review/P__1',
          prompt: { name: 'P', version: '1', content: 'body' },
        },
      ],
    };
    const formData = new FormData();
    formData.append('publication', new Blob([JSON.stringify(publication)], { type: 'application/json' }));

    const result = await instance.updatePublication(TOKEN_MOCK, formData);

    expect(result.success).toBe(true);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain('/v1/ops/publication/update');
    const dto = JSON.parse((init as RequestInit).body as string);
    expect(dto.url).toBe('publications/public/req');
    expect(dto.targetFolder).toBe('public/folder/');
    expect(dto.resourceTypes).toEqual(['PROMPT']);
    expect(dto.resources[0].targetUrl).toBe('prompts/public/folder/P__1');
    expect(clients.updateAsset).toHaveBeenCalledTimes(1);
  });
});
