import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { DialRule, RuleFunction } from '@/src/models/dial/rule';
import { CorePublicationsApi } from '@/src/server/entities/core-publications-api';
import { EnrichmentClients } from '@/src/server/publications/resolver/types';
import { CORE_TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { getRulesCore, updateRulesCore } from '../folders-core';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

// The folder flow runs against the real publications client, which `folders-core.spec.ts` mocks out, so a
// disagreement between the encoding done in the client (`ruleList`) and by the caller (`create`) is visible.
vi.mock('@/src/app/api/api', () => ({
  publicationsApi: new CorePublicationsApi({ host: 'http://core.test/' }, {} as EnrichmentClients),
}));

const sentBody = async (index: number): Promise<Record<string, unknown>> =>
  JSON.parse(await (fetch.mock.calls[index][0] as Request).clone().text());

const sentUrl = (index: number): string => (fetch.mock.calls[index][0] as Request).url;

describe('Server :: Folders :: folders-core :: folder with a space in its name', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('reads rules with the folder encoded', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({ rules: { 'public/My%20Folder/': [{ source: 'title', function: 'EQUAL', targets: ['x'] }] } }),
      JSON_HEADERS,
    );

    const result = await getRulesCore(TOKEN_MOCK, 'public/My Folder/');

    expect(sentUrl(0)).toBe(`${CORE_TEST_URL}v1/ops/publication/rule/list`);
    expect(await sentBody(0)).toEqual({ url: 'public/My%20Folder/' });
    expect(result).toMatchObject({
      success: true,
      response: { 'public/My Folder/': [{ source: 'title', function: 'EQUAL', targets: ['x'] }] },
    });
  });

  test('writes rules with the folder encoded by the caller and approves the url Core returned unchanged', async () => {
    fetch.mockResponseOnce(JSON.stringify({ url: 'publications/public/My%20Folder/' }), JSON_HEADERS);
    fetch.mockResponseOnce(JSON.stringify({ success: true }));
    const rules: DialRule[] = [{ source: 'title', function: RuleFunction.EQUAL, targets: ['x'] }];

    const result = await updateRulesCore(TOKEN_MOCK, 'public/My Folder/', rules);

    expect(sentUrl(0)).toBe(`${CORE_TEST_URL}v1/ops/publication/create`);
    expect(await sentBody(0)).toMatchObject({ targetFolder: 'public/My%20Folder/', rules });
    expect(sentUrl(1)).toBe(`${CORE_TEST_URL}v1/ops/publication/approve`);
    expect(await sentBody(1)).toEqual({ url: 'publications/public/My%20Folder/' });
    expect(result.success).toBe(true);
  });
});
