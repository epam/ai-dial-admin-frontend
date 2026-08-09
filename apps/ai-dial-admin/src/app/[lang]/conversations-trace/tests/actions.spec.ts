import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ConversationFilters, FeedbackFilter } from '@/src/models/analytics/conversations-trace';
import { QueryMode, QueryOperator } from '@/src/models/analytics/query';
import { analyticsDataApi } from '@/src/app/api/api';
import { buildConversationsMock } from '@/src/mocks/analytics/conversations-trace';
import { getConversations } from '@/src/app/[lang]/conversations-trace/actions';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

// The action reads the switch on every call, so a getter lets a test flip it in place. Re-importing
// the action per test instead needs `vi.resetModules()`, which resolved the mocked api module
// inconsistently across platforms and left some tests asserting against a stale mock.
const mockSwitch = vi.hoisted(() => ({ on: false }));

vi.mock('@/src/mocks/analytics/conversations-trace', async () => ({
  ...(await vi.importActual<object>('@/src/mocks/analytics/conversations-trace')),
  get USE_CONVERSATIONS_MOCK() {
    return mockSwitch.on;
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

const executeAction = analyticsDataApi.executeAction as any;

const useFixtures = () => {
  mockSwitch.on = true;
};

const answerWithNoRows = () => executeAction.mockResolvedValue({ success: true, response: { rows: [] } });

const sentQuery = () => executeAction.mock.calls[0][0];

beforeEach(() => {
  vi.clearAllMocks();
  executeAction.mockReset();
  mockSwitch.on = false;
  (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
  (getIsEnableAuthToggle as any).mockReturnValue(true);
});

describe('conversations-trace :: server action with the mock switch on', () => {
  test('returns the fixtures for the supplied filters', async () => {
    useFixtures();

    const result = await getConversations(FILTERS);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toEqual(buildConversationsMock(FILTERS));
  });

  test('does not call the analytics api client', async () => {
    useFixtures();

    await getConversations(FILTERS);

    expect(executeAction).not.toHaveBeenCalled();
  });

  test('narrows the fixtures by search', async () => {
    useFixtures();

    const all = await getConversations(FILTERS);
    const matched = await getConversations({ ...FILTERS, search: 'internal-copilot' });

    expect(matched.response?.rows.length).toBeGreaterThan(0);
    expect(matched.response?.rows.length).toBeLessThan(all.response?.rows.length ?? 0);
  });

  test('narrows the fixtures by time range', async () => {
    useFixtures();

    const all = await getConversations(FILTERS);
    const recent = await getConversations({ ...FILTERS, startMs: END_MS - 60 * 60 * 1000 });

    expect(recent.response?.rows.length).toBeGreaterThan(0);
    expect(recent.response?.rows.length).toBeLessThan(all.response?.rows.length ?? 0);
  });

  test('narrows the fixtures by feedback without a second query', async () => {
    useFixtures();

    const all = await getConversations(FILTERS);
    const rated = await getConversations(RATED_FILTERS);

    expect(rated.response?.rows.length).toBeGreaterThan(0);
    expect(rated.response?.rows.length).toBeLessThan(all.response?.rows.length ?? 0);
    expect(executeAction).not.toHaveBeenCalled();
  });
});

describe('conversations-trace :: server action with the mock switch off', () => {
  test('delegates to the analytics api client with the caller token', async () => {
    answerWithNoRows();

    await getConversations(FILTERS);

    expect(executeAction).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
  });

  test('sends the conversation aggregate query', async () => {
    answerWithNoRows();

    await getConversations(FILTERS);

    const query = sentQuery();
    expect(query.entity).toBe('dial_usage_log');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual(['chat_id']);
    expect(query.page.include_total).toBe(false);
  });

  test('turns the epoch-millis bounds it was given into the time predicates', async () => {
    answerWithNoRows();

    await getConversations(FILTERS);

    const bounds = sentQuery().filter.args.filter((node: any) =>
      [QueryOperator.Ge, QueryOperator.Le].includes(node.op),
    );
    expect(bounds.map((node: any) => node.args[1].value)).toEqual([String(FILTERS.startMs), String(FILTERS.endMs)]);
  });

  test('puts the search term into the query rather than filtering the response', async () => {
    answerWithNoRows();

    await getConversations({ ...FILTERS, search: 'acme' });

    const searchGroup = sentQuery().filter.args.find((node: any) => node.op === 'or');
    expect(searchGroup.args.map((node: any) => node.args[1].value)).toEqual(['acme', 'acme']);
  });

  test('sends no search predicate when the term is empty', async () => {
    answerWithNoRows();

    await getConversations(FILTERS);

    expect(sentQuery().filter.args.some((node: any) => node.op === 'or')).toBe(false);
  });

  test('returns the rows from the api response', async () => {
    executeAction
      .mockResolvedValueOnce({ success: true, response: { rows: [CONVERSATION_ROW] } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } });

    const result = await getConversations(FILTERS);

    expect(result.response?.rows).toEqual([{ ...CONVERSATION_ROW, rating_up: 0, rating_down: 0 }]);
  });

  test('treats a missing rows array as empty rather than undefined', async () => {
    executeAction.mockResolvedValue({ success: true, response: {} });

    const result = await getConversations(FILTERS);

    expect(result.response?.rows).toEqual([]);
  });

  test('propagates a failure without inventing rows', async () => {
    executeAction.mockResolvedValue({ success: false, status: 400, errorMessage: 'unknown field' });

    const result = await getConversations(FILTERS);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('unknown field');
    expect(result.response).toBeUndefined();
  });

  test('issues only the conversation query when feedback is All and it returns nothing', async () => {
    answerWithNoRows();

    await getConversations(FILTERS);

    expect(executeAction).toHaveBeenCalledTimes(1);
    expect(sentQuery().entity).toBe('dial_usage_log');
  });
});

describe('conversations-trace :: server action resolving ratings for the page', () => {
  // The list query, then one count query per rating direction.
  const answerWithRatings = (upCount: number | null, downCount: number | null) => {
    const countRows = (count: number | null) =>
      count === null ? [] : [{ chat_id: CONVERSATION_ROW.chat_id, rating_count: count }];
    executeAction
      .mockResolvedValueOnce({ success: true, response: { rows: [CONVERSATION_ROW] } })
      .mockResolvedValueOnce({ success: true, response: { rows: countRows(upCount) } })
      .mockResolvedValueOnce({ success: true, response: { rows: countRows(downCount) } });
  };

  test('asks rate_analytics only for the conversations on this page, once per direction', async () => {
    answerWithRatings(null, null);

    await getConversations(FILTERS);

    const [, [upQuery], [downQuery]] = executeAction.mock.calls;
    [upQuery, downQuery].forEach((query) => {
      expect(query.entity).toBe('rate_analytics');
      const inPredicate = query.filter.args.find((node: any) => node.op === QueryOperator.In);
      expect(inPredicate.args[1].items.map((item: any) => item.value)).toEqual([CONVERSATION_ROW.chat_id]);
    });
  });

  // `rate` is signed (-1 for a dislike, 0 for a normalized boolean false), so each direction is counted
  // under its own predicate rather than split out of one count and sum.
  test('counts the two directions with the strict/non-strict pair the feedback filter uses', async () => {
    answerWithRatings(null, null);

    await getConversations(FILTERS);

    const [, [upQuery], [downQuery]] = executeAction.mock.calls;
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
    answerWithRatings(upCount, downCount);

    const result = await getConversations(FILTERS);

    expect(result.response?.rows[0]).toMatchObject({ rating_up: expectedUp, rating_down: expectedDown });
  });

  test('treats a conversation with no rating row as zero on both sides', async () => {
    answerWithRatings(null, null);

    const result = await getConversations(FILTERS);

    expect(result.response?.rows[0]).toMatchObject({ rating_up: 0, rating_down: 0 });
  });

  test('skips the ratings query when the page is empty', async () => {
    answerWithNoRows();

    await getConversations(FILTERS);

    expect(executeAction).toHaveBeenCalledTimes(1);
  });

  test('still returns the conversations when the ratings query fails, with the rating unresolved', async () => {
    executeAction
      .mockResolvedValueOnce({ success: true, response: { rows: [CONVERSATION_ROW] } })
      .mockResolvedValueOnce({ success: false, status: 400, errorMessage: 'unknown field' });

    const result = await getConversations(FILTERS);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toHaveLength(1);
    expect(result.response?.rows[0]).toMatchObject({ rating_up: null, rating_down: null });
  });
});

describe('conversations-trace :: server action resolving a feedback filter', () => {
  const RATED_IDS = ['9f2c4b17-6d3a-4e58-b0c1-7ae95f83d204', 'c41e8a90-2f76-4bd3-9e05-18c7b6a4f2de'];

  const answerTwoStep = (feedbackRows: Array<Record<string, unknown>>, conversationRows: unknown[] = []) => {
    executeAction
      .mockResolvedValueOnce({ success: true, response: { rows: feedbackRows } })
      .mockResolvedValueOnce({ success: true, response: { rows: conversationRows } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } })
      .mockResolvedValueOnce({ success: true, response: { rows: [] } });
  };

  const idRows = (ids: string[]) => ids.map((chat_id) => ({ chat_id, last_rated: 1 }));

  test('queries rate_analytics first, then dial_usage_log', async () => {
    answerTwoStep(idRows(RATED_IDS));

    await getConversations(RATED_FILTERS);

    const [[feedbackQuery], [conversationQuery]] = executeAction.mock.calls;
    expect(feedbackQuery.entity).toBe('rate_analytics');
    expect(conversationQuery.entity).toBe('dial_usage_log');
  });

  test('sends the caller token on both queries', async () => {
    answerTwoStep(idRows(RATED_IDS));

    await getConversations(RATED_FILTERS);

    executeAction.mock.calls.forEach((call: unknown[]) => {
      expect(call[1]).toBe(TOKEN_MOCK);
    });
  });

  test('narrows the conversation query to the ids the feedback query returned', async () => {
    answerTwoStep(idRows(RATED_IDS));

    await getConversations(RATED_FILTERS);

    const [, [conversationQuery]] = executeAction.mock.calls;
    const inPredicate = conversationQuery.filter.args.find((node: any) => node.op === QueryOperator.In);
    expect(inPredicate.args[1].items.map((item: any) => item.value)).toEqual(RATED_IDS);
  });

  test('returns no rows without a second query when nothing carries the feedback', async () => {
    answerTwoStep([]);

    const result = await getConversations(RATED_FILTERS);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toEqual([]);
    expect(executeAction).toHaveBeenCalledTimes(1);
  });

  test('drops blank ids rather than sending one that can match nothing', async () => {
    answerTwoStep(idRows(['', RATED_IDS[0]]));

    await getConversations(RATED_FILTERS);

    const [, [conversationQuery]] = executeAction.mock.calls;
    const inPredicate = conversationQuery.filter.args.find((node: any) => node.op === QueryOperator.In);
    expect(inPredicate.args[1].items.map((item: any) => item.value)).toEqual([RATED_IDS[0]]);
  });

  test('does not run the conversation query when the feedback query fails', async () => {
    executeAction.mockResolvedValue({ success: false, status: 400, errorMessage: 'unknown field' });

    const result = await getConversations(RATED_FILTERS);

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('unknown field');
    expect(result.response).toBeUndefined();
    expect(executeAction).toHaveBeenCalledTimes(1);
  });

  test('carries the search term into the narrowed conversation query', async () => {
    answerTwoStep(idRows(RATED_IDS));

    await getConversations({ ...RATED_FILTERS, search: 'acme' });

    const [, [conversationQuery]] = executeAction.mock.calls;
    expect(conversationQuery.filter.args.some((node: any) => node.op === 'or')).toBe(true);
    expect(conversationQuery.filter.args.some((node: any) => node.op === QueryOperator.In)).toBe(true);
  });

  test('returns the conversation rows, not the feedback rows', async () => {
    answerTwoStep(idRows(RATED_IDS), [{ ...CONVERSATION_ROW, chat_id: RATED_IDS[0] }]);

    const result = await getConversations(RATED_FILTERS);

    expect(result.response?.rows.map((row) => row.chat_id)).toEqual([RATED_IDS[0]]);
  });
});
