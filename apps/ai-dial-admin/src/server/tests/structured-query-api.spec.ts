import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { QueryMode, StructuredQuery } from '@/src/models/evaluation/structured-query';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { StructuredQueryApi } from '../eval/structured-query-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: StructuredQueryApi', () => {
  const instance = new StructuredQueryApi({ host: TEST_URL });
  const query: StructuredQuery = { entity: 'runs', mode: QueryMode.Row };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('should execute a structured query and return the parsed result', async () => {
    const result = { rows: [{ id: '1' }], totalCount: 1 };
    fetch.mockResponseOnce(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });

    const res = await instance.execute(query, TOKEN_MOCK);

    expect(res).toEqual(result);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/queries/execute'), expect.anything());
  });

  test('should POST the query body', async () => {
    fetch.mockResponseOnce(JSON.stringify({ rows: [] }));

    await instance.execute(query, TOKEN_MOCK);

    const [, init] = fetch.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify(query));
  });

  test('should resolve to null on a failed response', async () => {
    fetch.mockResponseOnce('error', { status: 500 });

    const res = await instance.execute(query, TOKEN_MOCK);

    expect(res).toBeNull();
  });
});
