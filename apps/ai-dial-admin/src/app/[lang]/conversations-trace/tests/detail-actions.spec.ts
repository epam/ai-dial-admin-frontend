import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  getConversationDetail,
  getConversationFeedback,
  getConversationSpans,
  getConversationTracePage,
  getConversationTranscriptAvailability,
} from '@/src/app/[lang]/conversations-trace/actions';
import {
  CONVERSATION_FEEDBACK_LIMIT,
  CONVERSATION_SPAN_LIMIT,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  QueryMode,
  QueryOffsetPage,
  QueryOperator,
  QueryPredicate,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { UsageLogField } from '@/src/models/analytics/conversations-trace';
import { clearEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';

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

const COUNT_ROW = {
  chat_id: CHAT_ID,
  rating_up: 3,
  rate_zero: 2,
  rate_negative: 1,
  rate_bool_false: 1,
  rate_raw: 2,
  rate_events: 6,
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
  getEntitySchema().mockResolvedValue({ fields: [] });
  (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
});

describe('getConversationDetail', () => {
  test('queries the conversation by id with the user token', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [DETAIL_ROW], totalCount: 1 } });

    await getConversationDetail(CHAT_ID);

    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
    expect(call(0).mode).toBe(QueryMode.Row);
    expect((call(0).filter as QueryPredicate).op).toBe(QueryOperator.Eq);
    expect((call(0).page as QueryOffsetPage).limit).toBe(1);
  });

  test('returns the single row', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [DETAIL_ROW], totalCount: 1 } });

    const result = await getConversationDetail(CHAT_ID);

    expect(result.success).toBe(true);
    expect(result.response).toEqual({ conversation: DETAIL_ROW });
  });

  // The route branches on this: a successful query with no rows is a missing conversation, and must stay
  // distinguishable from a failed query, which leaves the response undefined.
  test('a successful query with no rows resolves to a null conversation, not undefined', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [], totalCount: 0 } });

    const result = await getConversationDetail(CHAT_ID);

    expect(result.success).toBe(true);
    expect(result.response).toEqual({ conversation: null });
    expect(result.response).not.toBeUndefined();
  });

  test('a failed query reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await getConversationDetail(CHAT_ID);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  test('passes an id containing path separators through unchanged', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [DETAIL_ROW], totalCount: 1 } });
    const pathLike = 'conversations/eRxsos/chathub-claude4__E2E';

    await getConversationDetail(pathLike);

    expect(JSON.stringify(call(0).filter)).toContain(pathLike);
  });
});

describe('getConversationFeedback', () => {
  const stubFeedback = (list: object, counts: object = { success: true, response: { rows: [COUNT_ROW] } }) =>
    execute().mockImplementation((query: StructuredQuery) =>
      Promise.resolve(query.mode === QueryMode.Aggregate ? counts : list),
    );

  test('queries the feedback rows with the shared limit and a total', async () => {
    stubFeedback({ success: true, response: { rows: [FEEDBACK_ROW], totalCount: 6 } });

    await getConversationFeedback(CHAT_ID);

    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);

    const listQuery = execute()
      .mock.calls.map((args: unknown[]) => args[0] as StructuredQuery)
      .find((query: StructuredQuery) => query.mode === QueryMode.Row);
    const page = listQuery?.page as QueryOffsetPage;
    expect(page.limit).toBe(CONVERSATION_FEEDBACK_LIMIT);
    expect(page.include_total).toBe(true);
  });

  test('returns the rows with the total so the panel can declare itself partial', async () => {
    stubFeedback({ success: true, response: { rows: [FEEDBACK_ROW], totalCount: 6 } });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.response).toMatchObject({ rows: [FEEDBACK_ROW], total: 6 });
  });

  test('resolves the direction figures from an aggregate rather than from the listed rows', async () => {
    stubFeedback({ success: true, response: { rows: [FEEDBACK_ROW], totalCount: 240 } });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.response?.ratings).toEqual({
      rating_up: 3,
      rating_down: 3,
      provable_down: 2,
      captured_form: 2,
      rate_events: 6,
    });
  });

  test('issues the aggregate narrowed to the conversation by equality', async () => {
    stubFeedback({ success: true, response: { rows: [] } });

    await getConversationFeedback(CHAT_ID);

    const countsQuery = execute()
      .mock.calls.map((args: unknown[]) => args[0] as StructuredQuery)
      .find((query: StructuredQuery) => query.mode === QueryMode.Aggregate);

    expect(countsQuery?.entity).toBe('response_ratings');
    expect((countsQuery?.filter as QueryPredicate).op).toBe(QueryOperator.Eq);
  });

  test('an absent total resolves to null rather than a guessed count', async () => {
    stubFeedback({ success: true, response: { rows: [FEEDBACK_ROW] } });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.response?.total).toBeNull();
  });

  test('no ratings resolves to an empty list and zeroed figures, not a failure', async () => {
    stubFeedback({ success: true, response: { rows: [], totalCount: 0 } }, { success: true, response: { rows: [] } });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.success).toBe(true);
    expect(result.response).toMatchObject({ rows: [], total: 0, ratings: NO_COUNTS });
  });

  test('a failed aggregate leaves the figures unresolved without taking the list down', async () => {
    stubFeedback({ success: true, response: { rows: [FEEDBACK_ROW], totalCount: 1 } }, { success: false });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toEqual([FEEDBACK_ROW]);
    expect(result.response?.ratings).toBeNull();
  });

  test('reports the comment text unreadable when the schema does not offer it', async () => {
    stubFeedback({ success: true, response: { rows: [FEEDBACK_ROW] } });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.response?.isCommentTextReadable).toBe(false);
  });

  test('a failed list query reports failure with no response', async () => {
    stubFeedback({ success: false, errorMessage: 'boom' });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });
});

describe('getConversationSpans', () => {
  test('reads one trace of one conversation with the user token', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });

    await getConversationSpans(CHAT_ID, TRACE_ID);

    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
    expect(call(0).entity).toBe(USAGE_LOG_ENTITY);
    expect(call(0).mode).toBe(QueryMode.Row);
    expect(JSON.stringify(call(0).filter)).toContain(TRACE_ID);
    expect((call(0).page as QueryOffsetPage).limit).toBe(CONVERSATION_SPAN_LIMIT);
  });

  test('returns the spans with the total so the view can declare itself partial', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 922 } });

    const result = await getConversationSpans(CHAT_ID, TRACE_ID);

    expect(result.response).toEqual({ spans: [SPAN_ROW], total: 922, modelOutputs: [] });
  });

  // The model-call bodies are the only record of what a model call produced, so the stream cannot be typed
  // without them. Narrow by construction: only the model-call hops, capped, never the whole trace.
  test('decodes what each model call produced, and ships no body', async () => {
    getEntitySchema().mockResolvedValue({
      fields: [UsageLogField.RequestBody, UsageLogField.ResponseBody].map((name) => ({
        name,
        type: 'string',
        source: name,
      })),
    });
    execute()
      .mockResolvedValueOnce({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } })
      .mockResolvedValueOnce({
        success: true,
        response: {
          rows: [
            {
              core_span_id: 's1',
              response_body: JSON.stringify({
                choices: [
                  {
                    message: {
                      content: 'an answer',
                      tool_calls: [{ function: { name: 'rag_search', arguments: '{"q":"cyber"}' } }],
                    },
                  },
                ],
              }),
            },
          ],
        },
      });

    const result = await getConversationSpans(CHAT_ID, TRACE_ID);

    expect(result.response?.modelOutputs).toEqual([
      {
        core_span_id: 's1',
        text: 'an answer',
        toolCalls: [{ name: 'rag_search', argumentsPreview: '{"q":"cyber"}' }],
        isUnread: false,
      },
    ]);
    expect(JSON.stringify(result.response)).not.toContain('choices');
  });

  // The outputs enrich the stream; the spans stand without them. A throwing schema read used to reject the
  // whole action, so the reader was told the trace could not be read when its rows were already in hand.
  test('returns the spans it read when the body enrichment throws', async () => {
    getEntitySchema().mockRejectedValue(new Error('schema unreachable'));
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });

    const result = await getConversationSpans(CHAT_ID, TRACE_ID);

    expect(result.response?.spans).toEqual([SPAN_ROW]);
    expect(result.response?.modelOutputs).toEqual([]);
  });

  // The stream still renders without them, with its model-call rows typed generically.
  test('reads no model bodies when the schema reports no response column', async () => {
    getEntitySchema().mockResolvedValue({ fields: [{ name: 'trace_id', type: 'string', source: 'trace_id' }] });
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });

    const result = await getConversationSpans(CHAT_ID, TRACE_ID);

    expect(result.response?.modelOutputs).toEqual([]);
    expect(execute()).toHaveBeenCalledOnce();
  });

  test('an absent total resolves to null rather than a guessed count', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW] } });

    const result = await getConversationSpans(CHAT_ID, TRACE_ID);

    expect(result.response?.total).toBeNull();
  });

  // Checked against the projected names rather than the serialized query, because `response_body_bytes` — a
  // `long` the chain does need — contains `response_body` as a substring.
  test('never asks for a body column', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });

    await getConversationSpans(CHAT_ID, TRACE_ID);

    const names = ((call(0).select ?? []) as { expr: { name?: string } }[]).map(({ expr }) => expr.name);

    expect(names).not.toContain('request_body');
    expect(names).not.toContain('response_body');
    expect(names).not.toContain('assembled_response');
    // The size is not the body: a `long` that decides whether a hop has text worth fetching.
    expect(names).toContain('response_body_bytes');
  });

  test('a failed query reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await getConversationSpans(CHAT_ID, TRACE_ID);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });
});

// The Chat option is gated on whether this caller can read body columns at all — a schema fact. Split out of
// the transcript read so the page can still answer it at open while the body read waits for the switch.
describe('getConversationTranscriptAvailability', () => {
  test('answers from the entity schema without issuing any query', async () => {
    getEntitySchema().mockResolvedValue({
      fields: [{ name: 'request_body' }, { name: 'response_body' }],
    });

    const result = await getConversationTranscriptAvailability();

    expect(result.response?.isReadable).toBe(true);
    expect(execute()).not.toHaveBeenCalled();
  });

  test('reports the body columns unreadable when the schema names neither', async () => {
    getEntitySchema().mockResolvedValue({ fields: [{ name: 'trace_id' }] });

    const result = await getConversationTranscriptAvailability();

    expect(result.response?.isReadable).toBe(false);
    expect(execute()).not.toHaveBeenCalled();
  });

  test('reports unreadable rather than throwing when the schema cannot be read', async () => {
    getEntitySchema().mockResolvedValue(undefined);

    const result = await getConversationTranscriptAvailability();

    expect(result.success).toBe(false);
    expect(result.response?.isReadable).toBe(false);
  });
});

describe('getConversationTracePage', () => {
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

  test('reads the page, then its roots and figures, with the user token', async () => {
    resolvePage([pageRow('t1', NOON)]);

    await getConversationTracePage(CHAT_ID, 'statgpt', NOON, NOON, 0);

    expect(execute()).toHaveBeenCalledTimes(3);
    expect(execute()).toHaveBeenNthCalledWith(1, expect.anything(), TOKEN_MOCK);
  });

  // The window the roots and figures passes share comes from the page's own rows, not the conversation's, so
  // a page spanning minutes reads a handful of partitions however long the conversation ran.
  test('scopes the roots and figures to the page own padded window', async () => {
    resolvePage([pageRow('t1', NOON, NOON + 60_000)]);

    await getConversationTracePage(CHAT_ID, 'statgpt', Date.UTC(2025, 0, 1), NOON, 0);

    const [rootsFrom, rootsTo] = boundsOf(1);
    expect(rootsFrom).toBe(Date.UTC(2026, 7, 26) - DAY);
    expect(rootsTo).toBe(Date.UTC(2026, 7, 27) - 1 + DAY);
    expect(boundsOf(2)).toEqual([rootsFrom, rootsTo]);
  });

  test('resolves nothing further when the page returns no trace', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [] } });

    const result = await getConversationTracePage(CHAT_ID, 'statgpt', NOON, NOON, 0);

    expect(result.response).toEqual({ groups: [], hasMore: false });
    expect(execute()).toHaveBeenCalledOnce();
  });

  // Aggregate mode never reports a total, so a full page is the only evidence another may exist.
  test('reports more only when the page came back full', async () => {
    resolvePage([pageRow('t1', NOON)]);

    expect((await getConversationTracePage(CHAT_ID, 'statgpt', NOON, NOON, 0)).response?.hasMore).toBe(false);
  });

  test('a failed page read reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await getConversationTracePage(CHAT_ID, 'statgpt', NOON, NOON, 0);

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

    const result = await getConversationTracePage(CHAT_ID, 'statgpt', NOON, NOON, 0);

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

    const result = await getConversationTracePage(CHAT_ID, 'statgpt', NOON, NOON, 0);

    expect(result.success).toBe(true);
    expect(result.response?.groups[0].isRootRecorded).toBe(false);
    expect(result.response?.groups[0].spans).toBe(4);
  });
});
