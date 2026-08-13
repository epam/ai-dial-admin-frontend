import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  getConversationDetail,
  getConversationFeedback,
  getConversationSpans,
  getConversationTurns,
} from '@/src/app/[lang]/conversations-trace/actions';
import {
  CONVERSATION_FEEDBACK_LIMIT,
  CONVERSATION_SPAN_LIMIT,
  CONVERSATION_TURN_LIMIT,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import { QueryMode, QueryOffsetPage, QueryOperator, QueryPredicate } from '@/src/models/analytics/query';
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
  turn_count: 930,
  first_request_time: '2026-07-22T11:50:28.506Z',
  last_request_time: '2026-07-22T12:00:52.157Z',
  prompt_tokens: 4293420,
  completion_tokens: 70174,
  total_tokens: 4363594,
  total_price: '10.79380012',
  success_count: 930,
  duration_ms: 0,
  avg_duration_ms: 0,
};

const FEEDBACK_ROW = { response_id: 'chatcmpl-x', rate: 1, request_time: '2026-07-20T19:12:59.268Z' };

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
const call = (index: number) => execute().mock.calls[index][0];

beforeEach(() => {
  vi.clearAllMocks();
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
  test('queries the feedback rows with the shared limit and a total', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [FEEDBACK_ROW], totalCount: 6 } });

    await getConversationFeedback(CHAT_ID);

    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);

    const page = call(0).page as QueryOffsetPage;
    expect(page.limit).toBe(CONVERSATION_FEEDBACK_LIMIT);
    expect(page.include_total).toBe(true);
  });

  test('returns the rows with the total so the panel can declare itself partial', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [FEEDBACK_ROW], totalCount: 6 } });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.response).toEqual({ rows: [FEEDBACK_ROW], total: 6 });
  });

  test('an absent total resolves to null rather than a guessed count', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [FEEDBACK_ROW] } });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.response?.total).toBeNull();
  });

  test('no ratings resolves to an empty list, not a failure', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [], totalCount: 0 } });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.success).toBe(true);
    expect(result.response).toEqual({ rows: [], total: 0 });
  });

  test('a failed query reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await getConversationFeedback(CHAT_ID);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });
});

describe('getConversationTurns', () => {
  test('aggregates the usage log with the user token and the shared limit', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [TURN_ROW] } });

    await getConversationTurns(CHAT_ID);

    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
    expect(call(0).entity).toBe(USAGE_LOG_ENTITY);
    expect(call(0).mode).toBe(QueryMode.Aggregate);
    expect((call(0).page as QueryOffsetPage).limit).toBe(CONVERSATION_TURN_LIMIT);
  });

  test('returns the aggregated turns', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [TURN_ROW] } });

    const result = await getConversationTurns(CHAT_ID);

    expect(result.response).toEqual({ turns: [TURN_ROW] });
  });

  test('a conversation with no recorded turns resolves to an empty list', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [] } });

    const result = await getConversationTurns(CHAT_ID);

    expect(result.success).toBe(true);
    expect(result.response).toEqual({ turns: [] });
  });

  // The route distinguishes these two: an empty list is a conversation without turns, an absent response
  // is an outage, and the transcript says something different for each.
  test('a failed query reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await getConversationTurns(CHAT_ID);

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

    expect(result.response).toEqual({ spans: [SPAN_ROW], total: 922 });
  });

  test('an absent total resolves to null rather than a guessed count', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW] } });

    const result = await getConversationSpans(CHAT_ID, TRACE_ID);

    expect(result.response?.total).toBeNull();
  });

  test('never asks for a body column', async () => {
    execute().mockResolvedValue({ success: true, response: { rows: [SPAN_ROW], totalCount: 1 } });

    await getConversationSpans(CHAT_ID, TRACE_ID);

    const serialized = JSON.stringify(call(0));
    expect(serialized).not.toContain('request_body');
    expect(serialized).not.toContain('response_body');
  });

  test('a failed query reports failure with no response', async () => {
    execute().mockResolvedValue({ success: false, errorMessage: 'boom' });

    const result = await getConversationSpans(CHAT_ID, TRACE_ID);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });
});
