import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ConversationFilters, FeedbackFilter } from '@/src/models/analytics/conversations-trace';
import { QueryMode, QueryOperator } from '@/src/models/analytics/query';
import { buildConversationsMock } from '@/src/mocks/analytics/conversations-trace';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api', () => ({
  analyticsDataApi: {
    executeAction: vi.fn(),
  },
}));

const END_MS = Date.parse('2026-07-28T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const FILTERS: ConversationFilters = {
  search: '',
  startMs: END_MS - 7 * DAY_MS,
  endMs: END_MS,
  feedback: FeedbackFilter.All,
};

const RATED_FILTERS: ConversationFilters = { ...FILTERS, feedback: FeedbackFilter.Positive };

const loadActions = async (useMock: boolean) => {
  vi.resetModules();
  vi.doMock('@/src/mocks/analytics/conversations-trace', async () => ({
    ...(await vi.importActual<object>('@/src/mocks/analytics/conversations-trace')),
    USE_CONVERSATIONS_MOCK: useMock,
  }));

  const [{ getConversations }, { analyticsDataApi }, { getUserToken }, { getIsEnableAuthToggle }] = await Promise.all([
    import('@/src/app/[lang]/conversations-trace/actions'),
    import('@/src/app/api/api'),
    import('@/src/utils/auth/auth-request'),
    import('@/src/utils/env/get-auth-toggle'),
  ]);

  (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
  (getIsEnableAuthToggle as any).mockReturnValue(true);
  (analyticsDataApi.executeAction as any).mockReset();

  return { getConversations, analyticsDataApi };
};

const loadLiveActions = async () => {
  const loaded = await loadActions(false);
  (loaded.analyticsDataApi.executeAction as any).mockResolvedValue({ success: true, response: { rows: [] } });
  return loaded;
};

const CONVERSATION_ROW = {
  chat_id: 'a',
  project: 'p',
  turns: 1,
  tokens: 2,
  cost: '0.1',
  last_activity: 1,
  title: null,
  snippet: null,
};

const sentQuery = (analyticsDataApi: any) => analyticsDataApi.executeAction.mock.calls[0][0];

describe('conversations-trace :: server action with the mock switch on', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.doUnmock('@/src/mocks/analytics/conversations-trace'));

  test('returns the fixtures for the supplied filters', async () => {
    const { getConversations } = await loadActions(true);

    const result = await getConversations(FILTERS);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toEqual(buildConversationsMock(FILTERS));
  });

  test('does not call the analytics api client', async () => {
    const { getConversations, analyticsDataApi } = await loadActions(true);

    await getConversations(FILTERS);

    expect(analyticsDataApi.executeAction).not.toHaveBeenCalled();
  });

  test('narrows the fixtures by search', async () => {
    const { getConversations } = await loadActions(true);

    const all = await getConversations(FILTERS);
    const matched = await getConversations({ ...FILTERS, search: 'internal-copilot' });

    expect(matched.response?.rows.length).toBeGreaterThan(0);
    expect(matched.response?.rows.length).toBeLessThan(all.response?.rows.length ?? 0);
  });

  test('narrows the fixtures by time range', async () => {
    const { getConversations } = await loadActions(true);

    const all = await getConversations(FILTERS);
    const recent = await getConversations({ ...FILTERS, startMs: END_MS - 60 * 60 * 1000 });

    expect(recent.response?.rows.length).toBeGreaterThan(0);
    expect(recent.response?.rows.length).toBeLessThan(all.response?.rows.length ?? 0);
  });

  test('narrows the fixtures by feedback without a second query', async () => {
    const { getConversations, analyticsDataApi } = await loadActions(true);

    const all = await getConversations(FILTERS);
    const rated = await getConversations(RATED_FILTERS);

    expect(rated.response?.rows.length).toBeGreaterThan(0);
    expect(rated.response?.rows.length).toBeLessThan(all.response?.rows.length ?? 0);
    expect(analyticsDataApi.executeAction).not.toHaveBeenCalled();
  });
});

describe('conversations-trace :: server action with the mock switch off', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.doUnmock('@/src/mocks/analytics/conversations-trace'));

  test('delegates to the analytics api client with the caller token', async () => {
    const { getConversations, analyticsDataApi } = await loadLiveActions();

    await getConversations(FILTERS);

    expect(analyticsDataApi.executeAction).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
  });

  test('sends the conversation aggregate query', async () => {
    const { getConversations, analyticsDataApi } = await loadLiveActions();

    await getConversations(FILTERS);

    const query = sentQuery(analyticsDataApi);
    expect(query.entity).toBe('dial_usage_log');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual(['chat_id']);
    expect(query.page.include_total).toBe(false);
  });

  test('turns the epoch-millis bounds it was given into the time predicates', async () => {
    const { getConversations, analyticsDataApi } = await loadLiveActions();

    await getConversations(FILTERS);

    const bounds = sentQuery(analyticsDataApi).filter.args.filter((node: any) =>
      [QueryOperator.Ge, QueryOperator.Le].includes(node.op),
    );
    expect(bounds.map((node: any) => node.args[1].value)).toEqual([String(FILTERS.startMs), String(FILTERS.endMs)]);
  });

  test('puts the search term into the query rather than filtering the response', async () => {
    const { getConversations, analyticsDataApi } = await loadLiveActions();

    await getConversations({ ...FILTERS, search: 'acme' });

    const searchGroup = sentQuery(analyticsDataApi).filter.args.find((node: any) => node.op === 'or');
    expect(searchGroup.args.map((node: any) => node.args[1].value)).toEqual(['acme', 'acme']);
  });

  test('sends no search predicate when the term is empty', async () => {
    const { getConversations, analyticsDataApi } = await loadLiveActions();

    await getConversations(FILTERS);

    expect(sentQuery(analyticsDataApi).filter.args.some((node: any) => node.op === 'or')).toBe(false);
  });

  test('returns the rows from the api response', async () => {
    const { getConversations, analyticsDataApi } = await loadActions(false);
    (analyticsDataApi.executeAction as any)
      .mockResolvedValueOnce({ success: true, response: { rows: [CONVERSATION_ROW] } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } });

    const result = await getConversations(FILTERS);

    expect(result.response?.rows).toEqual([{ ...CONVERSATION_ROW, rating_up: 0, rating_down: 0 }]);
  });

  test('treats a missing rows array as empty rather than undefined', async () => {
    const { getConversations, analyticsDataApi } = await loadActions(false);
    (analyticsDataApi.executeAction as any).mockResolvedValue({ success: true, response: {} });

    const result = await getConversations(FILTERS);

    expect(result.response?.rows).toEqual([]);
  });

  test('propagates a failure without inventing rows', async () => {
    const { getConversations, analyticsDataApi } = await loadActions(false);
    (analyticsDataApi.executeAction as any).mockResolvedValue({
      success: false,
      status: 400,
      errorMessage: 'unknown field',
    });

    const result = await getConversations(FILTERS);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('unknown field');
    expect(result.response).toBeUndefined();
  });

  test('issues only the conversation query when feedback is All and it returns nothing', async () => {
    const { getConversations, analyticsDataApi } = await loadLiveActions();

    await getConversations(FILTERS);

    expect(analyticsDataApi.executeAction).toHaveBeenCalledTimes(1);
    expect(sentQuery(analyticsDataApi).entity).toBe('dial_usage_log');
  });
});

describe('conversations-trace :: server action resolving ratings for the page', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.doUnmock('@/src/mocks/analytics/conversations-trace'));

  // The list query, then one count query per rating direction.
  const loadWithRatings = async (upCount: number | null, downCount: number | null) => {
    const loaded = await loadActions(false);
    const countRows = (count: number | null) =>
      count === null ? [] : [{ chat_id: CONVERSATION_ROW.chat_id, rating_count: count }];
    (loaded.analyticsDataApi.executeAction as any)
      .mockResolvedValueOnce({ success: true, response: { rows: [CONVERSATION_ROW] } })
      .mockResolvedValueOnce({ success: true, response: { rows: countRows(upCount) } })
      .mockResolvedValueOnce({ success: true, response: { rows: countRows(downCount) } });
    return loaded;
  };

  test('asks rate_analytics only for the conversations on this page, once per direction', async () => {
    const { getConversations, analyticsDataApi } = await loadWithRatings(null, null);

    await getConversations(FILTERS);

    const [, [upQuery], [downQuery]] = (analyticsDataApi.executeAction as any).mock.calls;
    [upQuery, downQuery].forEach((query) => {
      expect(query.entity).toBe('rate_analytics');
      const inPredicate = query.filter.args.find((node: any) => node.op === QueryOperator.In);
      expect(inPredicate.args[1].items.map((item: any) => item.value)).toEqual([CONVERSATION_ROW.chat_id]);
    });
  });

  // `rate` is signed (-1 for a dislike, 0 for a normalized boolean false), so each direction is counted
  // under its own predicate rather than split out of one count and sum.
  test('counts the two directions with the strict/non-strict pair the feedback filter uses', async () => {
    const { getConversations, analyticsDataApi } = await loadWithRatings(null, null);

    await getConversations(FILTERS);

    const [, [upQuery], [downQuery]] = (analyticsDataApi.executeAction as any).mock.calls;
    const ratePredicate = (query: any) => query.filter.args.find((node: any) => node.args?.[0]?.name === 'rate');

    expect(ratePredicate(upQuery)).toMatchObject({ op: QueryOperator.Gt, args: [{ name: 'rate' }, { value: '0' }] });
    expect(ratePredicate(downQuery)).toMatchObject({ op: QueryOperator.Le, args: [{ name: 'rate' }, { value: '0' }] });
  });

  test.each([
    ['all positive', 2, null, 2, 0],
    ['all negative', null, 2, 0, 2],
    ['one each way, which a count-and-sum split reported as none up', 1, 1, 1, 1],
    ['more likes than dislikes', 2, 1, 2, 1],
  ])('reports %s', async (_label, upCount, downCount, expectedUp, expectedDown) => {
    const { getConversations } = await loadWithRatings(upCount, downCount);

    const result = await getConversations(FILTERS);

    expect(result.response?.rows[0]).toMatchObject({ rating_up: expectedUp, rating_down: expectedDown });
  });

  test('treats a conversation with no rating row as zero on both sides', async () => {
    const { getConversations } = await loadWithRatings(null, null);

    const result = await getConversations(FILTERS);

    expect(result.response?.rows[0]).toMatchObject({ rating_up: 0, rating_down: 0 });
  });

  test('skips the ratings query when the page is empty', async () => {
    const { getConversations, analyticsDataApi } = await loadActions(false);
    (analyticsDataApi.executeAction as any).mockResolvedValue({ success: true, response: { rows: [] } });

    await getConversations(FILTERS);

    expect(analyticsDataApi.executeAction).toHaveBeenCalledTimes(1);
  });

  test('still returns the conversations when the ratings query fails, with the rating unresolved', async () => {
    const { getConversations, analyticsDataApi } = await loadActions(false);
    (analyticsDataApi.executeAction as any)
      .mockResolvedValueOnce({ success: true, response: { rows: [CONVERSATION_ROW] } })
      .mockResolvedValueOnce({ success: false, status: 400, errorMessage: 'unknown field' });

    const result = await getConversations(FILTERS);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toHaveLength(1);
    expect(result.response?.rows[0]).toMatchObject({ rating_up: null, rating_down: null });
  });
});

describe('conversations-trace :: server action resolving a feedback filter', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.doUnmock('@/src/mocks/analytics/conversations-trace'));

  const RATED_IDS = ['9f2c4b17-6d3a-4e58-b0c1-7ae95f83d204', 'c41e8a90-2f76-4bd3-9e05-18c7b6a4f2de'];

  const loadTwoStep = async (feedbackRows: Array<Record<string, unknown>>, conversationRows: unknown[] = []) => {
    const loaded = await loadActions(false);
    (loaded.analyticsDataApi.executeAction as any)
      .mockResolvedValueOnce({ success: true, response: { rows: feedbackRows } })
      .mockResolvedValueOnce({ success: true, response: { rows: conversationRows } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } });
    return loaded;
  };

  const idRows = (ids: string[]) => ids.map((chat_id) => ({ chat_id, last_rated: 1 }));

  test('queries rate_analytics first, then dial_usage_log', async () => {
    const { getConversations, analyticsDataApi } = await loadTwoStep(idRows(RATED_IDS));

    await getConversations(RATED_FILTERS);

    const [[feedbackQuery], [conversationQuery]] = (analyticsDataApi.executeAction as any).mock.calls;
    expect(feedbackQuery.entity).toBe('rate_analytics');
    expect(conversationQuery.entity).toBe('dial_usage_log');
  });

  test('sends the caller token on both queries', async () => {
    const { getConversations, analyticsDataApi } = await loadTwoStep(idRows(RATED_IDS));

    await getConversations(RATED_FILTERS);

    (analyticsDataApi.executeAction as any).mock.calls.forEach((call: unknown[]) => {
      expect(call[1]).toBe(TOKEN_MOCK);
    });
  });

  test('narrows the conversation query to the ids the feedback query returned', async () => {
    const { getConversations, analyticsDataApi } = await loadTwoStep(idRows(RATED_IDS));

    await getConversations(RATED_FILTERS);

    const [, [conversationQuery]] = (analyticsDataApi.executeAction as any).mock.calls;
    const inPredicate = conversationQuery.filter.args.find((node: any) => node.op === QueryOperator.In);
    expect(inPredicate.args[1].items.map((item: any) => item.value)).toEqual(RATED_IDS);
  });

  test('returns no rows without a second query when nothing carries the feedback', async () => {
    const { getConversations, analyticsDataApi } = await loadTwoStep([]);

    const result = await getConversations(RATED_FILTERS);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toEqual([]);
    expect(analyticsDataApi.executeAction).toHaveBeenCalledTimes(1);
  });

  test('drops blank ids rather than sending one that can match nothing', async () => {
    const { getConversations, analyticsDataApi } = await loadTwoStep(idRows(['', RATED_IDS[0]]));

    await getConversations(RATED_FILTERS);

    const [, [conversationQuery]] = (analyticsDataApi.executeAction as any).mock.calls;
    const inPredicate = conversationQuery.filter.args.find((node: any) => node.op === QueryOperator.In);
    expect(inPredicate.args[1].items.map((item: any) => item.value)).toEqual([RATED_IDS[0]]);
  });

  test('does not run the conversation query when the feedback query fails', async () => {
    const { getConversations, analyticsDataApi } = await loadActions(false);
    (analyticsDataApi.executeAction as any).mockResolvedValue({
      success: false,
      status: 400,
      errorMessage: 'unknown field',
    });

    const result = await getConversations(RATED_FILTERS);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('unknown field');
    expect(result.response).toBeUndefined();
    expect(analyticsDataApi.executeAction).toHaveBeenCalledTimes(1);
  });

  test('carries the search term into the narrowed conversation query', async () => {
    const { getConversations, analyticsDataApi } = await loadTwoStep(idRows(RATED_IDS));

    await getConversations({ ...RATED_FILTERS, search: 'acme' });

    const [, [conversationQuery]] = (analyticsDataApi.executeAction as any).mock.calls;
    expect(conversationQuery.filter.args.some((node: any) => node.op === 'or')).toBe(true);
    expect(conversationQuery.filter.args.some((node: any) => node.op === QueryOperator.In)).toBe(true);
  });

  test('returns the conversation rows, not the feedback rows', async () => {
    const { getConversations } = await loadTwoStep(idRows(RATED_IDS), [{ ...CONVERSATION_ROW, chat_id: RATED_IDS[0] }]);

    const result = await getConversations(RATED_FILTERS);

    expect(result.response?.rows.map((row) => row.chat_id)).toEqual([RATED_IDS[0]]);
  });
});
