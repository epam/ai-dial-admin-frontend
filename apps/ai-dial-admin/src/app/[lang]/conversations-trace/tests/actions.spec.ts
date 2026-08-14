import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  getConversationTotals,
  getConversations,
  getConversationsSchema,
  getRatedChatIds,
} from '@/src/app/[lang]/conversations-trace/actions';
import { FEEDBACK_CANDIDATE_LIMIT } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationFilterOperator,
  ConversationFilters,
  ConversationPageRequest,
  ConversationsField,
  FeedbackFilter,
} from '@/src/models/analytics/conversations-trace';
import { QueryMode, QueryOperator, QuerySortDirection } from '@/src/models/analytics/query';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const END_MS = Date.parse('2026-07-28T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const FILTERS: ConversationFilters = {
  search: '',
  startMs: END_MS - 7 * DAY_MS,
  endMs: END_MS,
  feedback: FeedbackFilter.All,
};

const REQUEST: ConversationPageRequest = { ...FILTERS, offset: 0, limit: 100 };

const CONVERSATION_ROW = {
  chat_id: 'a',
  project_id: 'p',
  user_hash: 'db7327ba3decd351',
  turn_count: 1,
  total_tokens: 2,
  total_price: '0.1',
  last_request_time: '2026-07-28T11:00:00.000Z',
  first_request_time: '2026-07-28T10:00:00.000Z',
};

const execute = () => analyticsDataApi.executeAction as unknown as ReturnType<typeof vi.fn>;

const call = (index: number) => execute().mock.calls[index][0];

const okPage = (rows: object[], totalCount: number | null = rows.length) => ({
  success: true,
  response: { rows, totalCount },
});

const ok = (rows: object[]) => ({ success: true, response: { rows } });

const failure = { success: false, status: 500, errorMessage: 'boom' };

beforeEach(() => {
  vi.clearAllMocks();
  (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
  (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
});

describe('getConversations', () => {
  test('queries the conversations entity in row mode with the caller token', async () => {
    execute().mockResolvedValue(okPage([CONVERSATION_ROW]));

    await getConversations(REQUEST);

    expect(execute()).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'conversations', mode: QueryMode.Row }),
      TOKEN_MOCK,
    );
  });

  test('carries the requested offset and limit into the query page', async () => {
    execute().mockResolvedValue(okPage([]));

    await getConversations({ ...REQUEST, offset: 200, limit: 100 });

    expect(call(0).page).toMatchObject({ offset: 200, limit: 100, include_total: true });
  });

  test('returns the rows and the total the service reported', async () => {
    execute()
      .mockResolvedValueOnce(okPage([CONVERSATION_ROW], 1886))
      .mockResolvedValue(ok([]));

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.total).toBe(1886);
    expect(result.response?.rows).toHaveLength(1);
  });

  test('reports a missing total as null rather than inventing one', async () => {
    execute()
      .mockResolvedValueOnce(okPage([CONVERSATION_ROW], null))
      .mockResolvedValue(ok([]));

    const result = await getConversations(REQUEST);

    expect(result.response?.total).toBeNull();
  });

  test('resolves ratings for exactly the returned page', async () => {
    execute()
      .mockResolvedValueOnce(okPage([CONVERSATION_ROW]))
      .mockResolvedValueOnce(ok([{ chat_id: 'a', rating_count: 2 }]))
      .mockResolvedValueOnce(ok([{ chat_id: 'a', rating_count: 1 }]));

    const result = await getConversations(REQUEST);

    expect(execute()).toHaveBeenCalledTimes(3);
    expect(call(1).entity).toBe('rate_analytics');
    expect(result.response?.rows[0]).toMatchObject({ rating_up: 2, rating_down: 1 });
  });

  test('skips the rating queries entirely when the page is empty', async () => {
    execute().mockResolvedValue(okPage([]));

    await getConversations(REQUEST);

    expect(execute()).toHaveBeenCalledTimes(1);
  });

  // Either direction missing leaves the split unknowable, so a half-counted rating must not be shown.
  test('leaves ratings unresolved when a direction fails, still returning the rows', async () => {
    execute()
      .mockResolvedValueOnce(okPage([CONVERSATION_ROW]))
      .mockResolvedValueOnce(ok([{ chat_id: 'a', rating_count: 2 }]))
      .mockResolvedValueOnce(failure);

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.rows[0]).toMatchObject({ rating_up: null, rating_down: null });
  });

  test('propagates a failed list query without a response', async () => {
    execute().mockResolvedValue(failure);

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  // An active feedback state narrows by `in`; building the query without ids would drop the predicate and
  // return every conversation instead of none.
  test('returns nothing without querying when a feedback state has no candidates', async () => {
    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive, chatIds: [] });

    expect(execute()).not.toHaveBeenCalled();
    expect(result.response).toEqual({ rows: [], total: 0 });
  });

  test('narrows the query by the candidate ids it was given', async () => {
    execute().mockResolvedValueOnce(okPage([])).mockResolvedValue(ok([]));

    await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive, chatIds: ['a', 'b'] });

    const args = (call(0).filter as { args: { op: QueryOperator }[] }).args;
    expect(args.some((node) => node.op === QueryOperator.In)).toBe(true);
  });
});

describe('getConversationsSchema', () => {
  test('reads the conversations entity schema with the caller token', async () => {
    const getEntitySchema = analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;
    getEntitySchema.mockResolvedValue({
      fields: [{ name: 'success_count', type: 'integer', source: 'conversations' }],
    });

    const schema = await getConversationsSchema();

    expect(getEntitySchema).toHaveBeenCalledWith('conversations', TOKEN_MOCK);
    expect(schema?.fields).toHaveLength(1);
  });

  test('returns null when the schema is unavailable', async () => {
    (analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    expect(await getConversationsSchema()).toBeNull();
  });
});

describe('getConversations :: projection', () => {
  test('projects the visible schema-driven fields', async () => {
    execute().mockResolvedValue(okPage([CONVERSATION_ROW]));

    await getConversations({ ...REQUEST, visibleFields: ['success_count'] });

    expect(JSON.stringify(call(0).select)).toContain('success_count');
  });
});

describe('getRatedChatIds', () => {
  test('queries rate_analytics and returns the candidate ids', async () => {
    execute().mockResolvedValue(ok([{ chat_id: 'a' }, { chat_id: 'b' }]));

    const result = await getRatedChatIds({ ...FILTERS, feedback: FeedbackFilter.Positive });

    expect(call(0).entity).toBe('rate_analytics');
    expect(result.response?.ids).toEqual(['a', 'b']);
  });

  test('drops blank and non-string ids', async () => {
    execute().mockResolvedValue(ok([{ chat_id: '' }, { chat_id: null }, { chat_id: 'a' }]));

    const result = await getRatedChatIds({ ...FILTERS, feedback: FeedbackFilter.Rated });

    expect(result.response?.ids).toEqual(['a']);
  });

  test('propagates a failure without a response', async () => {
    execute().mockResolvedValue(failure);

    const result = await getRatedChatIds({ ...FILTERS, feedback: FeedbackFilter.Positive });

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  test('reports an uncapped candidate set', async () => {
    execute().mockResolvedValue(ok([{ chat_id: 'a' }]));

    const result = await getRatedChatIds({ ...FILTERS, feedback: FeedbackFilter.Positive });

    expect(result.response?.isCapped).toBe(false);
  });

  test('reports a candidate set that reached the limit', async () => {
    const rows = Array.from({ length: FEEDBACK_CANDIDATE_LIMIT }, (_unused, index) => ({ chat_id: `c${index}` }));
    execute().mockResolvedValue(ok(rows));

    const result = await getRatedChatIds({ ...FILTERS, feedback: FeedbackFilter.Positive });

    expect(result.response?.isCapped).toBe(true);
  });
});

describe('getConversations :: sort and column filters', () => {
  test('carries the caller sort keys into the query', async () => {
    execute().mockResolvedValue(okPage([CONVERSATION_ROW]));

    await getConversations({
      ...REQUEST,
      sort: [{ field: ConversationsField.TotalPrice, direction: QuerySortDirection.Desc }],
    });

    expect(call(0).sort?.[0]).toMatchObject({ field: ConversationsField.TotalPrice, dir: QuerySortDirection.Desc });
  });

  test('carries the column filters into the query', async () => {
    execute().mockResolvedValue(okPage([CONVERSATION_ROW]));

    await getConversations({
      ...REQUEST,
      columnFilters: [
        { field: ConversationsField.ProjectId, operator: ConversationFilterOperator.Contains, value: 'acme' },
      ],
    });

    expect(JSON.stringify(call(0).filter)).toContain(ConversationsField.ProjectId);
  });

  test('the totals query carries the column filters too', async () => {
    execute().mockResolvedValue(ok([{ conversations: 1, cost: 1 }]));

    await getConversationTotals({
      ...FILTERS,
      columnFilters: [
        { field: ConversationsField.TurnCount, operator: ConversationFilterOperator.GreaterThan, value: '2' },
      ],
    });

    expect(JSON.stringify(call(0).filter)).toContain(ConversationsField.TurnCount);
  });
});

describe('getConversationTotals', () => {
  test('aggregates the count and cost under the list query filter', async () => {
    execute().mockResolvedValue(ok([{ conversations: 212, cost: 654.07 }]));

    const result = await getConversationTotals(FILTERS);

    expect(call(0)).toMatchObject({ entity: 'conversations', mode: QueryMode.Aggregate });
    expect(call(0).group_by).toBeUndefined();
    expect(result.response).toEqual({ conversations: 212, cost: 654.07 });
  });

  test('reports absent figures as null rather than zero', async () => {
    execute().mockResolvedValue(ok([]));

    const result = await getConversationTotals(FILTERS);

    expect(result.response).toEqual({ conversations: null, cost: null });
  });

  test('propagates a failure without a response', async () => {
    execute().mockResolvedValue(failure);

    const result = await getConversationTotals(FILTERS);

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  test('answers a candidate-less feedback state without querying', async () => {
    const result = await getConversationTotals({ ...FILTERS, feedback: FeedbackFilter.Negative }, []);

    expect(execute()).not.toHaveBeenCalled();
    expect(result.response).toEqual({ conversations: 0, cost: null });
  });
});
