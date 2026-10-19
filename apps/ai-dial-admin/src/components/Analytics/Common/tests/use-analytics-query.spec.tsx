import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useAnalyticsQuery } from '@/src/components/Analytics/Common/use-analytics-query';
import { ApiRoute } from '@/src/constants/api-routes';
import { StructuredQuery } from '@/src/models/analytics/query';
import { QueryRequestKind } from '@/src/models/analytics/query-builder';

const QUERY = { entity: 'dial_usage_log' } as unknown as StructuredQuery;

const answer = (envelope: object, status = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(envelope), { status })),
  );

/** Resolves nothing until the caller aborts, which is what an in-flight request looks like. */
const hang = () => {
  const fetchMock = vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

describe('useAnalyticsQuery', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  test('posts the query to the analytics route and reads the envelope', async () => {
    answer({ success: true, response: { rows: [{ calls: 1 }] } });
    const { result } = renderHook(() => useAnalyticsQuery());

    const outcome = await result.current.runQuery(QUERY);

    expect(fetch).toHaveBeenCalledWith(ApiRoute.AnalyticsQuery, expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)).toEqual({ query: QUERY });
    expect(outcome).toEqual({ isSuccess: true, result: { rows: [{ calls: 1 }] } });
  });

  test('sends a sql statement through the same route', async () => {
    answer({ success: true, response: { rows: [] } });
    const { result } = renderHook(() => useAnalyticsQuery());

    await result.current.runSql('SELECT 1');

    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)).toEqual({ sql: 'SELECT 1' });
  });

  // The service's own words reach the caller; the header stands in where it sent no message, and stays
  // available on its own for a caller that titles a notification with it.
  test('reports the failure the service described', async () => {
    answer(
      { success: false, errorHeader: 'Query rejected', errorMessage: 'unknown column', requestId: 'trace-1' },
      422,
    );
    const { result } = renderHook(() => useAnalyticsQuery());

    const outcome = await result.current.runQuery(QUERY);

    expect(outcome).toEqual({
      isSuccess: false,
      result: null,
      error: 'unknown column',
      errorHeader: 'Query rejected',
      requestId: 'trace-1',
    });
  });

  test('falls back to the header when the service sent no message', async () => {
    answer({ success: false, errorHeader: 'Query rejected' }, 422);
    const { result } = renderHook(() => useAnalyticsQuery());

    expect((await result.current.runQuery(QUERY)).error).toBe('Query rejected');
  });

  // A crashed route or a proxy can put HTML on the wire; the status is more use than the parser's complaint.
  test('reports the status when the body is not an envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>Gateway Timeout</html>', { status: 504, statusText: 'Gateway Timeout' })),
    );
    const { result } = renderHook(() => useAnalyticsQuery());

    const outcome = await result.current.runQuery(QUERY);

    expect(outcome.isSuccess).toBe(false);
    expect(outcome.error).toBe('504 Gateway Timeout');
  });

  // The point of the hook: what the view started stops with the view, in the service as well as here.
  test('aborts what is still in flight when the view unmounts', async () => {
    const fetchMock = hang();
    const { result, unmount } = renderHook(() => useAnalyticsQuery());

    const pending = result.current.runQuery(QUERY);
    const { signal } = fetchMock.mock.calls[0][1];

    unmount();

    expect(signal?.aborted).toBe(true);
    await expect(pending).resolves.toEqual({ isSuccess: false, result: null, isCancelled: true });
  });

  test('leaves a cancelled outcome carrying neither a result nor an error', async () => {
    hang();
    const { result, unmount } = renderHook(() => useAnalyticsQuery());

    const pending = result.current.runQuery(QUERY);
    unmount();

    const outcome = await pending;

    expect(outcome.result).toBeNull();
    expect(outcome.error).toBeUndefined();
    expect(outcome.errorHeader).toBeUndefined();
  });
});

describe('useAnalyticsQuery — exportCsv', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  const answerCsv = (body: string, headers: Record<string, string> = {}) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body, { status: 200, headers: { 'content-type': 'text/csv', ...headers } })),
    );

  test('posts a structured request to the CSV route and reads the file', async () => {
    answerCsv('id\r\n1\r\n', { 'content-disposition': 'attachment; filename="result.csv"', 'x-total-count': '7' });
    const { result } = renderHook(() => useAnalyticsQuery());

    const outcome = await result.current.exportCsv({ kind: QueryRequestKind.Structured, query: QUERY });

    expect(fetch).toHaveBeenCalledWith(ApiRoute.AnalyticsQueryCsv, expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)).toEqual({ query: QUERY });
    expect(outcome.isSuccess).toBe(true);
    expect(outcome.file?.fileName).toBe('result.csv');
    expect(outcome.file?.totalCount).toBe(7);
    expect(await outcome.file?.blob.text()).toBe('id\r\n1\r\n');
  });

  test('sends a sql request as a statement and names an unnamed file result.csv', async () => {
    answerCsv('n\r\n');
    const { result } = renderHook(() => useAnalyticsQuery());

    const outcome = await result.current.exportCsv({ kind: QueryRequestKind.Sql, sql: 'SELECT 1' });

    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)).toEqual({ sql: 'SELECT 1' });
    expect(outcome.file?.fileName).toBe('result.csv');
    expect(outcome.file).not.toHaveProperty('totalCount');
  });

  test('reports the failure the service described', async () => {
    answer({ success: false, errorHeader: 'bad_request', errorMessage: 'limit above 1000', requestId: 'trace-1' });
    const { result } = renderHook(() => useAnalyticsQuery());

    const outcome = await result.current.exportCsv({ kind: QueryRequestKind.Sql, sql: 'SELECT 1' });

    expect(outcome).toEqual({
      isSuccess: false,
      file: null,
      error: 'limit above 1000',
      errorHeader: 'bad_request',
      requestId: 'trace-1',
    });
  });

  test('reports the status when the failure body is not an envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>', { status: 502, statusText: 'Bad Gateway' })),
    );
    const { result } = renderHook(() => useAnalyticsQuery());

    const outcome = await result.current.exportCsv({ kind: QueryRequestKind.Sql, sql: 'SELECT 1' });

    expect(outcome).toEqual({ isSuccess: false, file: null, error: '502 Bad Gateway' });
  });

  test('aborts an export still in flight when the view unmounts', async () => {
    const fetchMock = hang();
    const { result, unmount } = renderHook(() => useAnalyticsQuery());

    const pending = result.current.exportCsv({ kind: QueryRequestKind.Structured, query: QUERY });
    const { signal } = fetchMock.mock.calls[0][1];

    unmount();

    expect(signal?.aborted).toBe(true);
    await expect(pending).resolves.toEqual({ isSuccess: false, file: null, isCancelled: true });
  });
});
