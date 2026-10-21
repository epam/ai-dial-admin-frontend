import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import { StructuredQuery } from '@/src/models/analytics/query';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

import { POST } from './route';

vi.mock('@/src/app/api/api');
vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');

const QUERY = { entity: 'dial_usage_log' } as unknown as StructuredQuery;
const CSV = 'id\r\n1\r\n';

const makeRequest = (body: object) =>
  new NextRequest('http://localhost/api/analytics/query/export-csv', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

const csvFile = (totalCount?: number, fileName = 'result.csv') => ({
  success: true,
  response: { blob: new Blob([CSV], { type: 'text/csv' }), fileName, ...(totalCount != null && { totalCount }) },
});

describe('POST /api/analytics/query/export-csv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
  });

  test('exports a structured query with the caller token and the request signal', async () => {
    vi.mocked(analyticsDataApi.executeCsvAction).mockResolvedValue(csvFile());

    const req = makeRequest({ query: QUERY });
    const res = await POST(req);

    expect(analyticsDataApi.executeCsvAction).toHaveBeenCalledWith(QUERY, TOKEN_MOCK, req.signal);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/csv; charset=UTF-8');
    expect(res.headers.get('content-disposition')).toContain('filename="result.csv"');
    expect(res.headers.get('x-total-count')).toBeNull();
    expect(await res.text()).toBe(CSV);
  });

  test('exports a sql statement through the SQL CSV method', async () => {
    vi.mocked(analyticsDataApi.executeSqlCsvAction).mockResolvedValue(csvFile());

    const req = makeRequest({ sql: 'SELECT 1' });
    await POST(req);

    expect(analyticsDataApi.executeSqlCsvAction).toHaveBeenCalledWith('SELECT 1', TOKEN_MOCK, req.signal);
    expect(analyticsDataApi.executeCsvAction).not.toHaveBeenCalled();
  });

  test('passes the reported total on', async () => {
    vi.mocked(analyticsDataApi.executeCsvAction).mockResolvedValue(csvFile(4200));

    const res = await POST(makeRequest({ query: QUERY }));

    expect(res.headers.get('x-total-count')).toBe('4200');
  });

  test('names the file result.csv when the service sent no name', async () => {
    vi.mocked(analyticsDataApi.executeCsvAction).mockResolvedValue(csvFile(undefined, ''));

    const res = await POST(makeRequest({ query: QUERY }));

    expect(res.headers.get('content-disposition')).toContain('filename="result.csv"');
  });

  test('refuses a caller with no token while auth is enabled', async () => {
    vi.mocked(getUserToken).mockResolvedValue(undefined as never);

    const res = await POST(makeRequest({ sql: 'SELECT 1' }));

    expect(res.status).toBe(401);
    expect(analyticsDataApi.executeSqlCsvAction).not.toHaveBeenCalled();
  });

  test('refuses a body carrying neither a query nor a statement', async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect(analyticsDataApi.executeCsvAction).not.toHaveBeenCalled();
  });

  test('returns the failure envelope as JSON', async () => {
    const failure = { success: false, status: 400, errorHeader: 'bad_request', errorMessage: 'limit above 1000' };
    vi.mocked(analyticsDataApi.executeCsvAction).mockResolvedValue(failure);

    const res = await POST(makeRequest({ query: QUERY }));

    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual(failure);
  });

  test('answers with an envelope when the client throws', async () => {
    vi.mocked(analyticsDataApi.executeCsvAction).mockRejectedValue(new Error('socket hang up'));

    const res = await POST(makeRequest({ query: QUERY }));

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ success: false, errorMessage: 'socket hang up' });
  });
});
