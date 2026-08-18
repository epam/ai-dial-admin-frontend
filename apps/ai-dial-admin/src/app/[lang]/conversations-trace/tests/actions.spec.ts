import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import { getConversations, getConversationsSchema } from '@/src/app/[lang]/conversations-trace/actions';
import { FEEDBACK_CANDIDATE_LIMIT } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationFilterOperator,
  ConversationFilters,
  ConversationPageRequest,
  ConversationsField,
  FeedbackFilter,
} from '@/src/models/analytics/conversations-trace';
import { QueryMode, QueryOperator, QuerySortDirection, StructuredQuery } from '@/src/models/analytics/query';
import { clearEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
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
const LATER_PAGE: ConversationPageRequest = { ...FILTERS, offset: 100, limit: 100 };

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

const ok = (rows: object[]) => ({ success: true, response: { rows } });

const failure = { success: false, status: 500, errorMessage: 'boom' };

// One fetch cycle now issues up to four differently shaped queries, two of them concurrently, so tests
// say what each query answers rather than depending on the order they happen to run in.
enum QueryKind {
  List = 'list',
  Totals = 'totals',
  Candidates = 'candidates',
  Ratings = 'ratings',
}

const kindOf = (query: StructuredQuery): QueryKind => {
  if (query.entity === 'rate_analytics') {
    const isCandidates = (query.select ?? []).some((column) => column.as === 'last_rated');
    return isCandidates ? QueryKind.Candidates : QueryKind.Ratings;
  }
  return query.mode === QueryMode.Aggregate ? QueryKind.Totals : QueryKind.List;
};

interface Stubs {
  list?: object;
  totals?: object;
  candidates?: object;
  ratings?: object[];
}

const stub = ({ list = ok([]), totals = ok([{ conversations: 0, cost: null }]), candidates, ratings }: Stubs = {}) => {
  let ratingCall = 0;
  execute().mockImplementation((query: StructuredQuery) => {
    switch (kindOf(query)) {
      case QueryKind.Candidates:
        return Promise.resolve(candidates ?? ok([]));
      case QueryKind.Totals:
        return Promise.resolve(totals);
      case QueryKind.Ratings:
        return Promise.resolve(ratings?.[ratingCall++] ?? ok([]));
      default:
        return Promise.resolve(list);
    }
  });
};

const issued = (kind: QueryKind): StructuredQuery[] =>
  execute()
    .mock.calls.map((args) => args[0] as StructuredQuery)
    .filter((query) => kindOf(query) === kind);

const queryOf = (kind: QueryKind): StructuredQuery => issued(kind)[0];

beforeEach(() => {
  vi.clearAllMocks();
  clearEntitySchemaCache();
  (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
  (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
});

describe('getConversations', () => {
  test('queries the conversations entity in row mode with the caller token', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations(REQUEST);

    expect(execute()).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'conversations', mode: QueryMode.Row }),
      TOKEN_MOCK,
    );
  });

  test('carries the requested offset and limit into the query page', async () => {
    stub();

    await getConversations({ ...REQUEST, offset: 200, limit: 100 });

    expect(queryOf(QueryKind.List).page).toMatchObject({ offset: 200, limit: 100 });
  });

  test('resolves ratings for exactly the returned page', async () => {
    stub({
      list: ok([CONVERSATION_ROW]),
      ratings: [ok([{ chat_id: 'a', rating_count: 2 }]), ok([{ chat_id: 'a', rating_count: 1 }])],
    });

    const result = await getConversations(REQUEST);

    expect(issued(QueryKind.Ratings)).toHaveLength(2);
    expect(result.response?.rows[0]).toMatchObject({ rating_up: 2, rating_down: 1 });
  });

  test('skips the rating queries entirely when the page is empty', async () => {
    stub();

    await getConversations(REQUEST);

    expect(issued(QueryKind.Ratings)).toHaveLength(0);
  });

  // Either direction missing leaves the split unknowable, so a half-counted rating must not be shown.
  test('leaves ratings unresolved when a direction fails, still returning the rows', async () => {
    stub({ list: ok([CONVERSATION_ROW]), ratings: [ok([{ chat_id: 'a', rating_count: 2 }]), failure] });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.rows[0]).toMatchObject({ rating_up: null, rating_down: null });
  });

  // The failure still propagates, but the summary is its own query — so whatever it resolved comes back
  // with the failure rather than being discarded alongside the rows.
  test('propagates a failed list query, carrying no rows but the summary it resolved', async () => {
    stub({ list: failure, totals: ok([{ conversations: 212, cost: null }]) });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(false);
    expect(result.response?.rows).toEqual([]);
    expect(result.response?.totals).toEqual({ conversations: 212, cost: null });
  });
});

describe('getConversations :: the result total', () => {
  // The totals query resolves the same count under the same filter, so asking the list query for one too
  // would scan the filtered result a second time on every page fetched.
  test('never asks the list query for a total', async () => {
    stub();

    await getConversations(REQUEST);
    await getConversations(LATER_PAGE);

    issued(QueryKind.List).forEach((query) => expect(query.page).toMatchObject({ include_total: false }));
  });

  test('reports the total from the summary the same request resolved', async () => {
    stub({ list: ok([CONVERSATION_ROW]), totals: ok([{ conversations: 1886, cost: 654.07 }]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.total).toBe(1886);
    expect(result.response?.totals).toEqual({ conversations: 1886, cost: 654.07 });
  });

  test('coerces a summary count the service reported as a string', async () => {
    stub({ totals: ok([{ conversations: '212', cost: null }]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.total).toBe(212);
  });

  test('aggregates the count and cost under the list query filter', async () => {
    stub();

    await getConversations(REQUEST);

    expect(queryOf(QueryKind.Totals)).toMatchObject({ entity: 'conversations', mode: QueryMode.Aggregate });
    expect(queryOf(QueryKind.Totals).group_by).toBeUndefined();
  });

  test('the totals query carries the column filters too', async () => {
    stub();

    await getConversations({
      ...REQUEST,
      columnFilters: [
        { field: ConversationsField.TurnCount, operator: ConversationFilterOperator.GreaterThan, value: '2' },
      ],
    });

    expect(JSON.stringify(queryOf(QueryKind.Totals).filter)).toContain(ConversationsField.TurnCount);
  });

  test('reports absent figures as null rather than zero', async () => {
    stub({ totals: ok([]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.totals).toEqual({ conversations: null, cost: null });
  });

  // A row failure is no evidence about the figures and vice versa: each is resolved by its own query.
  test('a failed summary leaves the rows standing and omits the figures', async () => {
    stub({ list: ok([CONVERSATION_ROW]), totals: failure });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toHaveLength(1);
    expect(result.response?.totals).toBeUndefined();
    expect(result.response?.total).toBeNull();
  });

  test('a later page resolves no summary at all', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    const result = await getConversations(LATER_PAGE);

    expect(issued(QueryKind.Totals)).toHaveLength(0);
    expect(result.response?.totals).toBeUndefined();
  });

  // Sequencing the summary after the rows would make the merged call slower than the two separate
  // requests it replaces, so both are in flight before either resolves.
  test('runs the row query and the summary query concurrently', async () => {
    const inFlight: string[] = [];
    let releaseList = (): void => undefined;
    const listGate = new Promise((resolve) => {
      releaseList = () => resolve(ok([]));
    });

    execute().mockImplementation((query: StructuredQuery) => {
      inFlight.push(kindOf(query));
      return kindOf(query) === QueryKind.List ? listGate : Promise.resolve(ok([]));
    });

    const pending = getConversations(REQUEST);
    await Promise.resolve();

    expect(inFlight).toContain(QueryKind.Totals);

    releaseList();
    await pending;
  });
});

describe('getConversations :: the feedback candidates', () => {
  test('resolves the candidates itself on the first page and returns them', async () => {
    stub({ candidates: ok([{ chat_id: 'a' }, { chat_id: 'b' }]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(queryOf(QueryKind.Candidates).entity).toBe('rate_analytics');
    expect(result.response?.candidates?.ids).toEqual(['a', 'b']);
  });

  test('narrows the list query by the candidates it resolved', async () => {
    stub({ candidates: ok([{ chat_id: 'a' }]) });

    await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    const args = (queryOf(QueryKind.List).filter as { args: { op: QueryOperator }[] }).args;
    expect(args.some((node) => node.op === QueryOperator.In)).toBe(true);
  });

  test('drops blank and non-string ids', async () => {
    stub({ candidates: ok([{ chat_id: '' }, { chat_id: null }, { chat_id: 'a' }]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Rated });

    expect(result.response?.candidates?.ids).toEqual(['a']);
  });

  test('reports an uncapped candidate set', async () => {
    stub({ candidates: ok([{ chat_id: 'a' }]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(result.response?.candidates?.isCapped).toBe(false);
  });

  test('reports a candidate set that reached the limit', async () => {
    const rows = Array.from({ length: FEEDBACK_CANDIDATE_LIMIT }, (_unused, index) => ({ chat_id: `c${index}` }));
    stub({ candidates: ok(rows) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(result.response?.candidates?.isCapped).toBe(true);
  });

  test('propagates a failed candidate query without running the list query', async () => {
    stub({ candidates: failure });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(issued(QueryKind.List)).toHaveLength(0);
    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  // An active feedback state narrows by `in`; building the query without ids would drop the predicate and
  // return every conversation instead of none.
  test('returns nothing without querying when no conversation carries the feedback', async () => {
    stub({ candidates: ok([]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(issued(QueryKind.List)).toHaveLength(0);
    expect(issued(QueryKind.Totals)).toHaveLength(0);
    expect(result.response).toMatchObject({ rows: [], total: 0, totals: { conversations: 0, cost: null } });
  });

  test('a later page reuses the ids the caller carries rather than resolving them again', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations({ ...LATER_PAGE, feedback: FeedbackFilter.Positive, chatIds: ['a', 'b'] });

    expect(issued(QueryKind.Candidates)).toHaveLength(0);
    const args = (queryOf(QueryKind.List).filter as { args: { op: QueryOperator }[] }).args;
    expect(args.some((node) => node.op === QueryOperator.In)).toBe(true);
  });

  test('the default feedback state resolves no candidates', async () => {
    stub();

    await getConversations(REQUEST);

    expect(issued(QueryKind.Candidates)).toHaveLength(0);
  });
});

describe('getConversations :: projection', () => {
  test('projects the source-backed fields whether or not their columns are visible', async () => {
    stub();

    await getConversations({ ...REQUEST, sourceFields: ['success_count'], visibleEnrichmentFields: [] });

    expect(JSON.stringify(queryOf(QueryKind.List).select)).toContain('success_count');
  });

  test('projects an enrichment-backed field only while its column is visible', async () => {
    stub();

    await getConversations({ ...REQUEST, visibleEnrichmentFields: ['conversation_insights.topic'] });
    const withColumn = JSON.stringify(queryOf(QueryKind.List).select);

    vi.clearAllMocks();
    stub();
    await getConversations({ ...REQUEST, visibleEnrichmentFields: [] });

    expect(withColumn).toContain('conversation_insights.topic');
    expect(JSON.stringify(queryOf(QueryKind.List).select)).not.toContain('conversation_insights.topic');
  });
});

describe('getConversations :: sort and column filters', () => {
  test('carries the caller sort keys into the query', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations({
      ...REQUEST,
      sort: [{ field: ConversationsField.TotalPrice, direction: QuerySortDirection.Desc }],
    });

    expect(queryOf(QueryKind.List).sort?.[0]).toMatchObject({
      field: ConversationsField.TotalPrice,
      dir: QuerySortDirection.Desc,
    });
  });

  test('carries the column filters into the query', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations({
      ...REQUEST,
      columnFilters: [
        { field: ConversationsField.ProjectId, operator: ConversationFilterOperator.Contains, value: 'acme' },
      ],
    });

    expect(JSON.stringify(queryOf(QueryKind.List).filter)).toContain(ConversationsField.ProjectId);
  });
});

describe('getConversationsSchema', () => {
  const getEntitySchema = () => analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;

  test('reads the conversations entity schema with the caller token', async () => {
    getEntitySchema().mockResolvedValue({
      fields: [{ name: 'success_count', type: 'integer', source: 'success_count' }],
    });

    const result = await getConversationsSchema();

    expect(getEntitySchema()).toHaveBeenCalledWith('conversations', TOKEN_MOCK);
    expect(result.success).toBe(true);
    expect(result.response?.fields).toHaveLength(1);
  });

  test('reports a failure so the view can say the additional columns are unavailable', async () => {
    getEntitySchema().mockResolvedValue(null);

    const result = await getConversationsSchema();

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });

  test('serves a repeated load from the cache rather than querying again', async () => {
    getEntitySchema().mockResolvedValue({ fields: [] });

    await getConversationsSchema();
    const result = await getConversationsSchema();

    expect(getEntitySchema()).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });
});
