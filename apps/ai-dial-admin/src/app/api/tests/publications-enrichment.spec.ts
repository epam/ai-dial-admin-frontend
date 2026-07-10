import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

/**
 * Exercises the *real* `publicationsApi` export (not a mock of `EnrichmentClients`) to prove
 * the actual wiring in `src/app/api/api.ts` re-points enrichment through `AssetApi` end to end
 * — the acceptance bar for `migrate-publications-enrichment-to-core` (design's fidelity goal).
 * Per-type field-mapping correctness itself is already covered by `add-core-asset-client`'s
 * `asset-metadata.spec.ts`; this test is about the wiring, not re-deriving that mapping.
 */
describe('Server :: api :: publications enrichment re-pointed to AssetApi', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('getPublication enriches a pending prompt resource via direct Core calls, not the admin BE', async () => {
    const { publicationsApi } = await import('@/src/app/api/api');

    // 0. POST /v1/ops/publication/get
    fetch.mockResponseOnce(
      JSON.stringify({
        url: 'publications/public/req',
        status: 'PENDING',
        resourceTypes: ['PROMPT'],
        resources: [
          {
            action: 'ADD',
            sourceUrl: 'prompts/src/P__1.0',
            reviewUrl: 'prompts/review/P__1.0',
            targetUrl: 'prompts/public/P__1.0',
          },
        ],
      }),
      JSON_HEADERS,
    );
    // 1. Target-exists check: content GET at the target path — not found
    fetch.mockResponseOnce('not found', { status: 404 });
    // 2. Real fetch: content GET at the review path
    fetch.mockResponseOnce(JSON.stringify({ content: 'prompt body' }), JSON_HEADERS);
    // 3. Real fetch: metadata GET at the review path
    fetch.mockResponseOnce(
      JSON.stringify({ name: 'P__1.0', nodeType: 'ITEM', url: 'prompts/review/P__1.0', author: 'me', updatedAt: 123 }),
      JSON_HEADERS,
    );

    const result = (await publicationsApi.getPublication(TOKEN_MOCK, 'public/req')) as Record<string, unknown>;

    // Every request must have gone to Core (the admin BE URL never appears).
    for (const call of fetch.mock.calls) {
      expect(call[0]).not.toContain('DIAL_ADMIN_API_URL');
    }
    // Requests 1-3 hit the versioned-resource content/metadata endpoints, not any /api/v1/... BE path.
    expect(fetch.mock.calls[1][0]).toContain('v1/prompts/');
    expect(fetch.mock.calls[2][0]).toContain('v1/prompts/');
    expect(fetch.mock.calls[3][0]).toContain('v1/metadata/prompts/');

    expect(result.resourceIssues).toEqual([]);
    const prompts = result.prompts as { prompt: Record<string, unknown> }[];
    expect(prompts[0].prompt).toMatchObject({
      content: 'prompt body',
      name: 'P',
      version: '1.0',
      author: 'me',
      folderId: 'review/',
    });
  });

  test('updatePublication persists a versioned-type resource body to Core with no conditional header', async () => {
    const { publicationsApi } = await import('@/src/app/api/api');
    const { IF_MATCH, IF_NONE_MATCH } = await import('@/src/constants/api-headers');

    fetch.mockResponse(JSON.stringify({ success: true }));

    const publication = {
      path: 'public/req',
      requestName: 'My request',
      folderId: 'public/folder',
      rules: [],
      prompts: [
        {
          action: 'ADD',
          sourceUrl: 'prompts/src/P__1',
          targetUrl: 'prompts/old/P__1',
          reviewUrl: 'prompts/review/P__1',
          prompt: { name: 'P', version: '1', content: 'body', path: 'old/P__1' },
        },
      ],
    };
    const formData = new FormData();
    formData.append('publication', new Blob([JSON.stringify(publication)], { type: 'application/json' }));

    const result = await publicationsApi.updatePublication(TOKEN_MOCK, formData);

    expect(result.success).toBe(true);
    // Last call is the per-resource PUT to Core; DEFAULT_ETAG ('*') means no real precondition.
    const putCall = fetch.mock.calls[fetch.mock.calls.length - 1];
    expect(putCall[0]).toContain('v1/prompts/');
    expect((putCall[1] as RequestInit).method).toBe('PUT');
    const headers = (putCall[1] as RequestInit).headers as Record<string, string>;
    expect(headers[IF_MATCH]).toBeUndefined();
    expect(headers[IF_NONE_MATCH]).toBeUndefined();
  });
});
