import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi, sessionsSourceApi } from '@/src/app/api/api';
import {
  getSessionDetail,
  getSessionFeedback,
  getSessionSpans,
  getSessionTracePage,
  getHopBodyGrants,
} from '@/src/app/[lang]/sessions/actions';
import { SESSION_FEEDBACK_LIMIT, SESSION_SPAN_LIMIT, USAGE_LOG_ENTITY } from '@/src/constants/analytics/sessions-trace';
import { QueryMode, QueryOffsetPage, QueryOperator, QueryPredicate } from '@/src/models/analytics/query';
import { UsageLogField, SessionScope } from '@/src/models/analytics/sessions-trace';
import { clearEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';

// `getSessionTracePage` takes the scope the rollup resolved, not a bare id: `source: 'chat_id'`
// is the case these tests cover — an id that came from a session header.
const SCOPE: SessionScope = { id: CHAT_ID, source: UsageLogField.ChatId };

const DETAIL_ROW = {
  chat_id: CHAT_ID,
  project_id: '',
  user_hash: 'db73',
  turn_count: 12,
  first_request_time: '2026-07-22T11:50:28.506Z',
  last_request_time: '2026-07-22T12:00:52.157Z',
  prompt_tokens: 4293420,
  completion_tokens: 70174,
  total_tokens: 4363594,
  total_price: '10.79380012',
  success_count: 12,
  duration_ms: 0,
  avg_duration_ms: 0,
};

const FEEDBACK_ROW = {
  response_id: 'chatcmpl-x',
  first_rate_time: '2026-07-20T19:12:59.268Z',
  last_rate_time: '2026-07-20T19:12:59.268Z',
  rate_pos_count: 1,
  rate_zero_count: 0,
  rate_neg_count: 0,
  rate_distinct_count: 1,
  comment_count: 0,
};

const UNRESOLVED_COUNTS = {
  rating_up: null,
  rating_down: null,
  provable_down: null,
  captured_form: null,
  rate_events: null,
};

const NO_COUNTS = { rating_up: 0, rating_down: 0, provable_down: 0, captured_form: 0, rate_events: 0 };

const TRACE_ID = '0a3f1d9c8b7e6a5f';

const TURN_ROW = { trace_id: TRACE_ID, started: 1, hops: 3, tokens: 16366, cost: '0.045', duration_ms: 5215 };

const SPAN_ROW = {
  core_span_id: 's1',
  core_parent_span_id: null,
  event_kind: 'llm_call',
  deployment: 'switchyard-model',
  operation_duration_ms: 5215,
  deployment_price: '0.001',
  request_time: '2026-08-13T10:59:05.600Z',
};

const execute = () => analyticsDataApi.executeAction as unknown as ReturnType<typeof vi.fn>;
const getEntitySchema = () => analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;
const call = (index: number) => execute().mock.calls[index][0];

beforeEach(() => {
  vi.clearAllMocks();
  clearEntitySchemaCache();
  // No readable response column by default, so the tests about the spans read are not also model-body tests.
  getEntitySchema().mockResolvedValue({ success: true, response: { fields: [] } });
  (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
  vi.mocked(sessionsSourceApi.getSetting).mockResolvedValue({ success: true });
});

const SESSION_FIELDS = [
  { name: 'client_session_id', type: 'string', source: 'client_session_id' },
  { name: 'last_request_time', type: 'timestamp', source: 'last_request_time' },
  { name: 'project_id', type: 'string', source: 'project_id' },
  { name: 'total_price', type: 'decimal', source: 'total_price' },
  { name: 'turn_count', type: 'long', source: 'turn_count' },
];

const SESSION_RATING_FIELDS = [
  'rate_pos_count',
  'rate_zero_count',
  'rate_neg_count',
  'rate_bool_false_count',
  'rate_raw_count',
  'rate_event_count',
].map((name) => ({ name: `session_ratings.${name}`, type: 'long', source: name }));

const RESPONSE_RATING = 'response_feedback';

const RESPONSE_RATING_FIELDS = ['rate_pos_count', 'rate_zero_count', 'rate_neg_count', 'rate_event_count'].map(
  (name) => ({ name: `${RESPONSE_RATING}.${name}`, type: 'long', source: name }),
);

const stubSchemas = (sessions: object[] = SESSION_FIELDS, usageLog: object[] = []) =>
  getEntitySchema().mockImplementation((entity: string) =>
    Promise.resolve({ success: true, response: { fields: entity === USAGE_LOG_ENTITY ? usageLog : sessions } }),
  );

describe('getSessionDetail', () => {
  beforeEach(() => {
    stubSchemas();
  });

  test('queries the session by id with the user token', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [DETAIL_ROW], totalCount: 1 } });

    await getSessionDetail(CHAT_ID);

    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
    expect(call(0).entity).toBe('sessions');
    expect(call(0).mode).toBe(QueryMode.Row);
    expect((call(0).filter as QueryPredicate).op).toBe(QueryOperator.Eq);
    expect((call(0).page as QueryOffsetPage).limit).toBe(1);
  });

  test('returns the single row with unresolved rating figures where the schema has no rating enrichment', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [DETAIL_ROW], totalCount: 1 } });

    const result = await getSessionDetail(CHAT_ID);

    expect(result.success).toBe(true);
    expect(result.response).toEqual({ session: { ...DETAIL_ROW, ...UNRESOLVED_COUNTS } });
  });

  test('composes the session rating counts from the rating enrichment fields', async () => {
    stubSchemas([...SESSION_FIELDS, ...SESSION_RATING_FIELDS]);
    execute().mockResolvedValue({
      success: true,
      response: {
        rows: [
          {
            ...DETAIL_ROW,
            'session_ratings.rate_pos_count': 3,
            'session_ratings.rate_zero_count': 2,
            'session_ratings.rate_neg_count': 1,
            'session_ratings.rate_bool_false_count': 1,
            'session_ratings.rate_raw_count': 2,
            'session_ratings.rate_event_count': 6,
          },
        ],
      },
    });

    const result = await getSessionDetail(CHAT_ID);

    expect(result.response?.session).toMatchObject({
      rating_up: 3,
      rating_down: 3,
      provable_down: 2,
      captured_form: 2,
      rate_events: 6,
    });
  });

  test('states zero ratings for a session the rating enrichment has no row for', async () => {
    stubSchemas([...SESSION_FIELDS, ...SESSION_RATING_FIELDS]);
    execute().mockResolvedValue({ success: true, response: { rows: [DETAIL_ROW] } });

    const result = await getSessionDetail(CHAT_ID);

    expect(result.response?.session).toMatchObject(NO_COUNTS);
  });

  test('selects the rating enrichment fields the composed counts are read from', async () => {
    stubSchemas([...SESSION_FIELDS, ...SESSION_RATING_FIELDS]);
    execute().mockResolvedValue({ success: true, response: { rows: [DETAIL_ROW] } });

    await getSessionDetail(CHAT_ID);

    expect(JSON.stringify(call(0).select)).toContain('session_ratings.rate_pos_count');
  });

  // The route branches on this: a successful query with no rows is a missing session, and must stay
  // distinguishable from a failed query, which leaves the response undefined.
  test('a successful query with no rows resolves to a null session, not undefined', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [], totalCount: 0 } });

    const result = await getSessionDetail(CHAT_ID);

    expect(result.success).toBe(true);
    expect(result.response).toEqual({ session: null });
    expect(result.response).not.toBeUndefined();
  });

  test('a failed query reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await getSessionDetail(CHAT_ID);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  test('a required role the schema does not report fails without a session query', async () => {
    stubSchemas(SESSION_FIELDS.filter(({ name }) => name !== 'last_request_time'));

    const result = await getSessionDetail(CHAT_ID);

    expect(result.success).toBe(false);
    expect(execute()).not.toHaveBeenCalled();
  });

  test('passes an id containing path separators through unchanged', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [DETAIL_ROW], totalCount: 1 } });
    const pathLike = 'sessions/eRxsos/chathub-claude4__E2E';

    await getSessionDetail(pathLike);

    expect(JSON.stringify(call(0).filter)).toContain(pathLike);
  });
});

describe('getSessionFeedback', () => {
  const FIRST = '2026-07-22T11:50:28.506Z';
  const LAST = '2026-07-22T12:00:52.157Z';
  const read = () => getSessionFeedback(SCOPE, FIRST, LAST);

  beforeEach(() => {
    stubSchemas(SESSION_FIELDS, RESPONSE_RATING_FIELDS);
  });

  test('reads the rated responses from the usage log rating enrichment with the user token', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [FEEDBACK_ROW] } });

    await read();

    expect(execute()).toHaveBeenCalledOnce();
    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
    expect(call(0).entity).toBe(USAGE_LOG_ENTITY);
    expect(call(0).mode).toBe(QueryMode.Aggregate);
    expect(JSON.stringify(call(0))).toContain(`${RESPONSE_RATING}.rate_pos_count`);
    expect((call(0).page as QueryOffsetPage).limit).toBe(SESSION_FEEDBACK_LIMIT);
  });

  test('scopes the read to the session hops', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [] } });

    await read();

    expect(JSON.stringify(call(0).filter)).toContain(CHAT_ID);
  });

  test('returns the rows with their count where the list came back short of the limit', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [FEEDBACK_ROW] } });

    const result = await read();

    expect(result.response).toEqual({
      rows: [FEEDBACK_ROW],
      total: 1,
      isCommentTextReadable: false,
      isAvailable: true,
    });
  });

  test('reports no total where the list came back full, so the panel declares itself partial', async () => {
    const rows = Array.from({ length: SESSION_FEEDBACK_LIMIT }, (_, index) => ({
      ...FEEDBACK_ROW,
      response_id: `r-${index}`,
    }));
    execute().mockResolvedValue({ success: true, response: { rows } });

    const result = await read();

    expect(result.response?.total).toBeNull();
  });

  test('reports the comment text readable only where the schema offers it', async () => {
    stubSchemas(SESSION_FIELDS, [
      ...RESPONSE_RATING_FIELDS,
      { name: `${RESPONSE_RATING}.comment_sample`, type: 'string', source: 'comment_sample' },
    ]);
    execute().mockResolvedValue({ success: true, response: { rows: [FEEDBACK_ROW] } });

    const result = await read();

    expect(result.response?.isCommentTextReadable).toBe(true);
    expect(JSON.stringify(call(0).select)).toContain(`${RESPONSE_RATING}.comment_sample`);
  });

  test('lists nothing and reads nothing where the usage log has no response rating enrichment', async () => {
    stubSchemas(SESSION_FIELDS, []);

    const result = await read();

    expect(execute()).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      response: { rows: [], total: 0, isCommentTextReadable: false, isAvailable: false },
    });
  });

  test('reads nothing for a session with no recorded window', async () => {
    const result = await getSessionFeedback(SCOPE, null, null);

    expect(execute()).not.toHaveBeenCalled();
    expect(result.response).toMatchObject({ rows: [], isAvailable: true });
  });

  test('a failed list query reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await read();

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });
});

describe('getSessionSpans', () => {
  test('reads one trace with the user token', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });

    await getSessionSpans(TRACE_ID);

    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
    expect(call(0).entity).toBe(USAGE_LOG_ENTITY);
    expect(call(0).mode).toBe(QueryMode.Row);
    expect(JSON.stringify(call(0).filter)).toContain(TRACE_ID);
    expect((call(0).page as QueryOffsetPage).limit).toBe(SESSION_SPAN_LIMIT);
  });

  test('returns the spans with the total so the view can declare itself partial', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 922 } });

    const result = await getSessionSpans(TRACE_ID);

    expect(result.response?.spans).toEqual([SPAN_ROW]);
    expect(result.response?.total).toBe(922);
  });

  // The rail's field set travels with the spans, resolved from the same schema read the body grant already
  // performs — so the groups describe the projection that read actually named.
  test('returns the field groups the rail presents, resolved from the hop log schema', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });
    getEntitySchema().mockResolvedValue({
      success: true,
      response: {
        fields: [{ name: 'usage_client_identity.client_type', type: 'string', source: 'client_type', tag: 'client' }],
      },
    });

    const result = await getSessionSpans(TRACE_ID);

    expect(result.response?.fieldGroups).toEqual([
      {
        tag: 'client',
        fields: [
          {
            name: 'usage_client_identity.client_type',
            label: 'Client type',
            type: 'string',
            tag: 'client',
          },
        ],
      },
    ]);
  });

  // A schema this console cannot read costs the rail its groups and nothing else: the tree, the bodies and
  // the rail's own figures are built from the columns the projection falls back to.
  test('still returns the spans when the schema read fails, with no field groups', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });
    getEntitySchema().mockResolvedValue({ success: false, response: undefined });

    const result = await getSessionSpans(TRACE_ID);

    expect(result.response?.spans).toEqual([SPAN_ROW]);
    expect(result.response?.fieldGroups).toEqual([]);
  });

  test('an absent total resolves to null rather than a guessed count', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW] } });

    const result = await getSessionSpans(TRACE_ID);

    expect(result.response?.total).toBeNull();
  });

  // One query for the rows, and the schema the body grant already fetches for the field set — so the rail's
  // fields cost no request of their own and no body is read at all.
  test('issues one query and reuses the cached schema read', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });

    await getSessionSpans(TRACE_ID);

    expect(execute()).toHaveBeenCalledOnce();
    expect(getEntitySchema()).toHaveBeenCalledWith(USAGE_LOG_ENTITY, TOKEN_MOCK);
  });

  // Checked against the projected names rather than the serialized query, because `response_body_bytes` — a
  // `long` the chain does need — contains `response_body` as a substring.
  test('never asks for a body column', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });

    await getSessionSpans(TRACE_ID);

    const names = ((call(0).select ?? []) as { expr: { name?: string } }[]).map(({ expr }) => expr.name);

    expect(names).not.toContain('request_body');
    expect(names).not.toContain('response_body');
    expect(names).not.toContain('assembled_response');
    // The size is not the body: a `long` that decides whether a hop has text worth fetching.
    expect(names).toContain('response_body_bytes');
  });

  test('a failed query reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await getSessionSpans(TRACE_ID);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });
});

describe('getHopBodyGrants', () => {
  test('answers from the entity schema without issuing any query', async () => {
    getEntitySchema().mockResolvedValue({
      success: true,
      response: {
        fields: [{ name: 'dial_usage_log_payload.request_body' }, { name: 'dial_usage_log_payload.response_body' }],
      },
    });

    const result = await getHopBodyGrants();

    expect(result.response).toEqual({ isRequestReadable: true, isResponseReadable: true });
    expect(execute()).not.toHaveBeenCalled();
  });

  test('reports the body columns unreadable when the schema names neither', async () => {
    getEntitySchema().mockResolvedValue({ success: true, response: { fields: [{ name: 'trace_id' }] } });

    const result = await getHopBodyGrants();

    expect(result.response).toEqual({ isRequestReadable: false, isResponseReadable: false });
    expect(execute()).not.toHaveBeenCalled();
  });

  test('reports unreadable rather than throwing when the schema cannot be read', async () => {
    getEntitySchema().mockResolvedValue({ success: false, status: 403 });

    const result = await getHopBodyGrants();

    expect(result.success).toBe(false);
    expect(result.response).toEqual({ isRequestReadable: false, isResponseReadable: false });
  });
});

describe('getSessionTracePage', () => {
  const pageRow = (traceId: string, firstMs: number, lastMs = firstMs) => ({
    trace_id: traceId,
    first_request_time: firstMs,
    last_request_time: lastMs,
  });
  const NOON = Date.UTC(2026, 7, 26, 12, 0, 0);
  const DAY = 24 * 60 * 60 * 1000;

  const boundsOf = (call: number) => {
    const query = execute().mock.calls[call][0];
    const times = query.filter.args.filter(
      (node: { args?: [{ name?: string }] }) => node.args?.[0]?.name === 'request_time',
    );
    return times.map((node: { args: [unknown, { value: string }] }) => Number(node.args[1].value));
  };

  const resolvePage = (rows: unknown[]) => {
    execute()
      .mockResolvedValueOnce({ success: true, response: { rows } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } });
  };

  const pageFilterNames = () =>
    execute()
      .mock.calls[0][0].filter.args.map((node: { args?: [{ name?: string }] }) => node.args?.[0]?.name)
      .filter(Boolean);
  const rootsSelectNames = () =>
    execute().mock.calls[1][0].select.map((column: { expr: { name?: string } }) => column.expr.name);

  test('scopes a session of unknown source by chat_id where the log serves no session id', async () => {
    resolvePage([pageRow('t1', NOON)]);

    await getSessionTracePage({ id: CHAT_ID }, 'demo-project', NOON, NOON, 0);

    expect(pageFilterNames()).toContain(UsageLogField.ChatId);
    expect(pageFilterNames()).not.toContain(UsageLogField.ClientSessionId);
    expect(rootsSelectNames()).toContain(UsageLogField.ChatId);
    expect(rootsSelectNames()).not.toContain(UsageLogField.ClientSessionId);
  });

  test('reads a blank source as unknown', async () => {
    resolvePage([pageRow('t1', NOON)]);

    await getSessionTracePage({ id: CHAT_ID, source: '' }, 'demo-project', NOON, NOON, 0);

    expect(pageFilterNames()).toContain(UsageLogField.ChatId);
  });

  test('scopes a session of unknown source by the session id where the log serves it', async () => {
    getEntitySchema().mockResolvedValue({
      success: true,
      response: { fields: [{ name: UsageLogField.ClientSessionId }] },
    });
    resolvePage([pageRow('t1', NOON)]);

    await getSessionTracePage({ id: CHAT_ID }, 'demo-project', NOON, NOON, 0);

    expect(pageFilterNames()).toContain(UsageLogField.ClientSessionId);
    expect(rootsSelectNames()).toContain(UsageLogField.ClientSessionId);
  });

  test('keeps the session id for a harness session even where the log does not serve it', async () => {
    resolvePage([pageRow('t1', NOON)]);

    await getSessionTracePage({ id: CHAT_ID, source: 'claude-code' }, 'demo-project', NOON, NOON, 0);

    expect(pageFilterNames()).toContain(UsageLogField.ClientSessionId);
  });

  test('reads the page, then its roots and figures, with the user token', async () => {
    resolvePage([pageRow('t1', NOON)]);

    await getSessionTracePage(SCOPE, 'demo-project', NOON, NOON, 0);

    expect(execute()).toHaveBeenCalledTimes(3);
    expect(execute()).toHaveBeenNthCalledWith(1, expect.anything(), TOKEN_MOCK);
  });

  // The window the roots and figures passes share comes from the page's own rows, not the session's, so
  // a page spanning minutes reads a handful of partitions however long the session ran.
  test('scopes the roots and figures to the page own padded window', async () => {
    resolvePage([pageRow('t1', NOON, NOON + 60_000)]);

    await getSessionTracePage(SCOPE, 'demo-project', Date.UTC(2025, 0, 1), NOON, 0);

    const [rootsFrom, rootsTo] = boundsOf(1);
    expect(rootsFrom).toBe(Date.UTC(2026, 7, 26) - DAY);
    expect(rootsTo).toBe(Date.UTC(2026, 7, 27) - 1 + DAY);
    expect(boundsOf(2)).toEqual([rootsFrom, rootsTo]);
  });

  test('resolves nothing further when the page returns no trace', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [] } });

    const result = await getSessionTracePage(SCOPE, 'demo-project', NOON, NOON, 0);

    expect(result.response).toEqual({ groups: [], hasMore: false });
    expect(execute()).toHaveBeenCalledOnce();
  });

  // Aggregate mode never reports a total, so a full page is the only evidence another may exist.
  test('reports more only when the page came back full', async () => {
    resolvePage([pageRow('t1', NOON)]);

    expect((await getSessionTracePage(SCOPE, 'demo-project', NOON, NOON, 0)).response?.hasMore).toBe(false);
  });

  test('a failed page read reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await getSessionTracePage(SCOPE, 'demo-project', NOON, NOON, 0);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  // The figures are the trace-level totals, so rendering without them would state 0 spans and no cost as the
  // trace's facts — the silently-wrong-figure outcome this design removes.
  test('a failed figures read fails the page rather than reporting zeroes', async () => {
    execute()
      .mockResolvedValueOnce({ success: true, response: { rows: [pageRow('t1', NOON)] } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } })
      .mockResolvedValueOnce({ success: false, errorMessage: 'figures unavailable' });

    const result = await getSessionTracePage(SCOPE, 'demo-project', NOON, NOON, 0);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  // A failed roots read costs the cards, not the page: the trace still renders from its figures, stating that
  // its entry call was not recorded.
  test('a failed roots read still renders the trace from its figures', async () => {
    execute()
      .mockResolvedValueOnce({ success: true, response: { rows: [pageRow('t1', NOON)] } })
      .mockResolvedValueOnce({ success: false, errorMessage: 'roots unavailable' })
      .mockResolvedValueOnce({
        success: true,
        response: {
          rows: [{ trace_id: 't1', event_kind: 'llm_call', spans: 4, tokens: 10, price: 1, failed_spans: 0 }],
        },
      });

    const result = await getSessionTracePage(SCOPE, 'demo-project', NOON, NOON, 0);

    expect(result.success).toBe(true);
    expect(result.response?.groups[0].isRootRecorded).toBe(false);
    expect(result.response?.groups[0].spans).toBe(4);
  });
});
