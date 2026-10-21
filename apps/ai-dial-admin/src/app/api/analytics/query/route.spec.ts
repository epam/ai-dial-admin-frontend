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

const makeRequest = (body: object) =>
  new NextRequest('http://localhost/api/analytics/query', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

describe('POST /api/analytics/query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
  });

  // The handler exists for the signal: without it a client that goes away leaves the service reading.
  test('runs a structured query with the caller token and the request signal', async () => {
    vi.mocked(analyticsDataApi.executeAction).mockResolvedValue({ success: true, response: { rows: [] } });

    const req = makeRequest({ query: QUERY });
    const res = await POST(req);

    expect(analyticsDataApi.executeAction).toHaveBeenCalledWith(QUERY, TOKEN_MOCK, req.signal);
    expect(await res.json()).toEqual({ success: true, response: { rows: [] } });
  });

  test('runs a sql query through the same path', async () => {
    vi.mocked(analyticsDataApi.executeSqlAction).mockResolvedValue({ success: true, response: { rows: [] } });

    const req = makeRequest({ sql: 'SELECT 1' });
    await POST(req);

    expect(analyticsDataApi.executeSqlAction).toHaveBeenCalledWith('SELECT 1', TOKEN_MOCK, req.signal);
    expect(analyticsDataApi.executeAction).not.toHaveBeenCalled();
  });

  // `middleware.ts` excludes /api from its matcher, so the handler is the only thing between an
  // unauthenticated caller and read-only SQL against the service.
  test('refuses a caller with no token while auth is enabled', async () => {
    vi.mocked(getUserToken).mockResolvedValue(undefined as never);

    const res = await POST(makeRequest({ sql: 'SELECT 1' }));

    expect(res.status).toBe(401);
    expect(analyticsDataApi.executeSqlAction).not.toHaveBeenCalled();
  });

  test('runs with no token while auth is disabled', async () => {
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(false);
    vi.mocked(getUserToken).mockResolvedValue(undefined as never);
    vi.mocked(analyticsDataApi.executeAction).mockResolvedValue({ success: true, response: { rows: [] } });

    const res = await POST(makeRequest({ query: QUERY }));

    expect(res.status).toBe(200);
    expect(analyticsDataApi.executeAction).toHaveBeenCalled();
  });

  test('refuses a body carrying neither a query nor a statement', async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect(analyticsDataApi.executeAction).not.toHaveBeenCalled();
  });

  // A thrown transport error would otherwise reach the client as Next's HTML error page, which fails at
  // `res.json()` and reports the parser instead of the service.
  test('answers with an envelope when the client throws', async () => {
    vi.mocked(analyticsDataApi.executeAction).mockRejectedValue(new Error('socket hang up'));

    const res = await POST(makeRequest({ query: QUERY }));

    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ success: false, errorMessage: 'socket hang up' });
  });

  // The envelope is the service's answer, not the handler's: a refusal reaches the caller whole.
  test('returns the failure envelope as the client gave it', async () => {
    vi.mocked(analyticsDataApi.executeAction).mockResolvedValue({
      success: false,
      status: 422,
      errorHeader: 'Query rejected',
      errorMessage: 'unknown column',
      requestId: 'trace-1',
    });

    const res = await POST(makeRequest({ query: QUERY }));

    expect(await res.json()).toEqual({
      success: false,
      status: 422,
      errorHeader: 'Query rejected',
      errorMessage: 'unknown column',
      requestId: 'trace-1',
    });
  });
});
