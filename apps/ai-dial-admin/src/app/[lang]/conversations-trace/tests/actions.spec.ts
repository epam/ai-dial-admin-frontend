import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  getConversationFieldValues,
  getConversationHopMessage,
  getConversationHopRawBody,
  getConversationHopRequest,
  getConversationHopResponse,
  getConversations,
  getConversationsSchema,
} from '@/src/app/[lang]/conversations-trace/actions';
import {
  ARRAY_VALUE_PAGE_SIZE,
  CONVERSATION_FIELD_VALUE_COUNT_ALIAS,
  FEEDBACK_CANDIDATE_LIMIT,
  RAW_BODY_BYTE_BUDGET,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationFieldValuesRequest,
  ConversationFilterOperator,
  ConversationFilters,
  ConversationPageRequest,
  ConversationScalarOperator,
  ConversationsField,
  FeedbackFilter,
  HopInspectorSide,
  HopReadState,
  MessageRole,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
import {
  QueryMode,
  QueryOffsetPage,
  QueryOperator,
  QuerySortDirection,
  StructuredQuery,
} from '@/src/models/analytics/query';
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
  client_session_id: 'a',
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

enum QueryKind {
  List = 'list',
  Totals = 'totals',
  RatingTotals = 'ratingTotals',
  Candidates = 'candidates',
  Ratings = 'ratings',
  // Step one of a filter over an array-valued column: the hop log's scalar `deployment` column, grouped.
  Resolution = 'resolution',
  // The grouped count that discovers an enum column's values.
  FieldValues = 'fieldValues',
}

const aliases = (query: StructuredQuery): (string | undefined)[] => (query.select ?? []).map((column) => column.as);

const kindOf = (query: StructuredQuery): QueryKind => {
  if (query.entity === 'response_ratings') {
    if (aliases(query).includes('last_rated')) {
      return QueryKind.Candidates;
    }
    return aliases(query).includes('rated_conversations') ? QueryKind.RatingTotals : QueryKind.Ratings;
  }
  if (query.entity === USAGE_LOG_ENTITY) {
    return QueryKind.Resolution;
  }
  if (aliases(query).includes(CONVERSATION_FIELD_VALUE_COUNT_ALIAS)) {
    return QueryKind.FieldValues;
  }
  return query.mode === QueryMode.Aggregate ? QueryKind.Totals : QueryKind.List;
};

// The rate predicate is all that separates the two rating aggregates.
const isNegativeRatingTotals = (query: StructuredQuery): boolean =>
  !JSON.stringify(query.filter).includes('rate_pos_count');

interface Stubs {
  list?: object;
  totals?: object;
  rated?: object;
  negative?: object;
  candidates?: object;
  ratings?: object;
  // A queue rather than one value: the resolution pages until a page comes back short, so a test of the
  // walk has to answer successive offsets differently.
  resolutions?: object[];
  fieldValues?: object;
}

const stub = ({
  list = ok([]),
  totals = ok([{ conversations: 0, cost: null }]),
  rated = ok([{ rated_conversations: 0 }]),
  negative = ok([{ rated_conversations: 0 }]),
  candidates,
  ratings,
  resolutions,
  fieldValues,
}: Stubs = {}) => {
  const pending = [...(resolutions ?? [])];

  execute().mockImplementation((query: StructuredQuery) => {
    switch (kindOf(query)) {
      case QueryKind.Resolution:
        return Promise.resolve(pending.shift() ?? ok([]));
      case QueryKind.FieldValues:
        return Promise.resolve(fieldValues ?? ok([]));
      case QueryKind.Candidates:
        return Promise.resolve(candidates ?? ok([]));
      case QueryKind.Totals:
        return Promise.resolve(totals);
      case QueryKind.RatingTotals:
        return Promise.resolve(isNegativeRatingTotals(query) ? negative : rated);
      case QueryKind.Ratings:
        return Promise.resolve(ratings ?? ok([]));
      default:
        return Promise.resolve(list);
    }
  });
};

const ratingRow = (overrides: Record<string, number | string | null> = {}) => ({
  chat_id: 'a',
  rating_up: 0,
  rate_zero: 0,
  rate_negative: 0,
  rate_bool_false: 0,
  rate_raw: 0,
  rate_events: 0,
  ...overrides,
});

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
      expect.objectContaining({ entity: 'sessions', mode: QueryMode.Row }),
      TOKEN_MOCK,
    );
  });

  test('carries the requested offset and limit into the query page', async () => {
    stub();

    await getConversations({ ...REQUEST, offset: 200, limit: 100 });

    expect(queryOf(QueryKind.List).page).toMatchObject({ offset: 200, limit: 100 });
  });

  test('resolves both directions for exactly the returned page in one query', async () => {
    stub({ list: ok([CONVERSATION_ROW]), ratings: ok([ratingRow({ rating_up: 2, rate_negative: 1 })]) });

    const result = await getConversations(REQUEST);

    expect(issued(QueryKind.Ratings)).toHaveLength(1);
    expect(result.response?.rows[0]).toMatchObject({ rating_up: 2, rating_down: 1 });
  });

  test('carries the caveat figures onto the row', async () => {
    stub({
      list: ok([CONVERSATION_ROW]),
      ratings: ok([ratingRow({ rate_zero: 4, rate_bool_false: 1, rate_raw: 1, rate_events: 4 })]),
    });

    const result = await getConversations(REQUEST);

    expect(result.response?.rows[0]).toMatchObject({ rating_down: 4, provable_down: 1, captured_form: 1 });
  });

  test('skips the rating queries entirely when the page is empty', async () => {
    stub();

    await getConversations(REQUEST);

    expect(issued(QueryKind.Ratings)).toHaveLength(0);
  });

  test('leaves ratings unresolved when the query fails, still returning the rows', async () => {
    stub({ list: ok([CONVERSATION_ROW]), ratings: failure });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.rows[0]).toMatchObject({ rating_up: null, rating_down: null });
  });

  test('propagates a failed list query, carrying no rows but the figures it resolved', async () => {
    stub({ list: failure, totals: ok([{ conversations: 212, cost: null }]) });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(false);
    expect(result.response?.rows).toEqual([]);
    expect(result.response?.period?.totals).toEqual({ conversations: 212, cost: null });
  });
});

describe('getConversations :: the period figures', () => {
  test('aggregates the count and cost over the period', async () => {
    stub();

    await getConversations(REQUEST);

    expect(queryOf(QueryKind.Totals)).toMatchObject({ entity: 'sessions', mode: QueryMode.Aggregate });
    expect(queryOf(QueryKind.Totals).group_by).toBeUndefined();
  });

  test('returns the count, the cost and both rating figures together', async () => {
    stub({
      totals: ok([{ conversations: 1886, cost: 654.07 }]),
      rated: ok([{ rated_conversations: 19 }]),
      negative: ok([{ rated_conversations: 13 }]),
    });

    const result = await getConversations(REQUEST);

    expect(result.response?.period).toEqual({
      totals: { conversations: 1886, cost: 654.07 },
      ratings: { rated: 19, negative: 13 },
    });
  });

  // A search or column predicate reaching the totals query would make the pills a summary of the filtered result.
  test('the totals query ignores the search term and the column filters', async () => {
    stub();

    await getConversations({
      ...REQUEST,
      search: 'acme',
      columnFilters: [
        { field: ConversationsField.TurnCount, operator: ConversationFilterOperator.GreaterThan, value: '2' },
      ],
    });

    const filter = JSON.stringify(queryOf(QueryKind.Totals).filter);

    expect(filter).not.toContain(ConversationsField.TurnCount);
    expect(filter).not.toContain('acme');
  });

  test('the rating totals are unmoved by the search term', async () => {
    stub();

    await getConversations({ ...REQUEST, search: 'acme' });

    issued(QueryKind.RatingTotals).forEach((query) => {
      expect(JSON.stringify(query.filter)).not.toContain('acme');
    });
  });

  test('issues one rating aggregate per rate predicate', async () => {
    stub();

    await getConversations(REQUEST);

    expect(issued(QueryKind.RatingTotals)).toHaveLength(2);
  });

  test('coerces rating figures the service reported as strings', async () => {
    stub({ rated: ok([{ rated_conversations: '19' }]), negative: ok([{ rated_conversations: '13' }]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.period?.ratings).toEqual({ rated: 19, negative: 13 });
  });

  test('reports absent figures as null rather than zero', async () => {
    stub({ totals: ok([]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.period?.totals).toEqual({ conversations: null, cost: null });
  });

  test('a failed rating aggregate leaves the count and cost standing', async () => {
    stub({ totals: ok([{ conversations: 212, cost: 1 }]), rated: failure });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.period?.totals).toEqual({ conversations: 212, cost: 1 });
    expect(result.response?.period?.ratings).toBeUndefined();
  });

  test('a failed totals aggregate leaves the rating figures standing', async () => {
    stub({ totals: failure, rated: ok([{ rated_conversations: 19 }]), negative: ok([{ rated_conversations: 13 }]) });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.period?.totals).toBeUndefined();
    expect(result.response?.period?.ratings).toEqual({ rated: 19, negative: 13 });
  });

  // A row failure is no evidence about the figures and vice versa: each is resolved by its own query.
  test('a failed summary leaves the rows standing', async () => {
    stub({ list: ok([CONVERSATION_ROW]), totals: failure, rated: failure, negative: failure });

    const result = await getConversations(REQUEST);

    expect(result.success).toBe(true);
    expect(result.response?.rows).toHaveLength(1);
    expect(result.response?.period).toEqual({});
  });

  // A feedback filter selecting nothing empties the grid, not the period; zeroes would assert an empty period.
  test('reports the period even when the feedback filter selects nothing', async () => {
    stub({ candidates: ok([]), totals: ok([{ conversations: 212, cost: 1 }]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Negative });

    expect(result.response?.rows).toEqual([]);
    expect(result.response?.total).toBe(0);
    expect(result.response?.period?.totals).toEqual({ conversations: 212, cost: 1 });
  });

  test('a later page resolves no figures at all', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    const result = await getConversations(LATER_PAGE);

    expect(issued(QueryKind.Totals)).toHaveLength(0);
    expect(issued(QueryKind.RatingTotals)).toHaveLength(0);
    expect(result.response?.period).toBeUndefined();
  });

  // Sequencing the figures after the rows would make the merged call slower than the requests it replaces.
  test('runs the row query and the period queries concurrently', async () => {
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

describe('getConversations :: the grid row total', () => {
  // The period totals resolve the same count when nothing narrows, so asking the list query for one too
  // would scan the result a second time on every page fetched.
  test('never asks the list query for a total', async () => {
    stub();

    await getConversations(REQUEST);
    await getConversations(LATER_PAGE);

    issued(QueryKind.List).forEach((query) => expect(query.page).toMatchObject({ include_total: false }));
  });

  test('reports the period count when no filter narrows', async () => {
    stub({ totals: ok([{ conversations: 1886, cost: 654.07 }]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.total).toBe(1886);
  });

  test('coerces a period count the service reported as a string', async () => {
    stub({ totals: ok([{ conversations: '212', cost: null }]) });

    const result = await getConversations(REQUEST);

    expect(result.response?.total).toBe(212);
  });

  // Under a filter the period count is not the grid's count, so offering it would overstate the result.
  // Without a total the grid finds the end by a page coming back short, which it already handles.
  test.each<[string, Partial<ConversationPageRequest>]>([
    ['a search term', { search: 'acme' }],
    [
      'a column filter',
      {
        columnFilters: [
          { field: ConversationsField.TurnCount, operator: ConversationFilterOperator.GreaterThan, value: '2' },
        ],
      },
    ],
  ])('reports no total when %s narrows the period', async (_label, overrides) => {
    stub({ totals: ok([{ conversations: 1886, cost: 1 }]) });

    const result = await getConversations({ ...REQUEST, ...overrides });

    expect(result.response?.total).toBeNull();
    expect(result.response?.period?.totals?.conversations).toBe(1886);
  });

  test('issues no count query of its own under a filter', async () => {
    stub();

    await getConversations({ ...REQUEST, search: 'acme' });

    expect(issued(QueryKind.Totals)).toHaveLength(1);
  });

  test('reports no total when the period count is unavailable', async () => {
    stub({ list: ok([CONVERSATION_ROW]), totals: failure });

    const result = await getConversations(REQUEST);

    expect(result.response?.total).toBeNull();
  });
});

describe('getConversations :: the feedback candidates', () => {
  test('resolves the candidates itself on the first page and returns them', async () => {
    stub({ candidates: ok([{ chat_id: 'a' }, { chat_id: 'b' }]) });

    const result = await getConversations({ ...REQUEST, feedback: FeedbackFilter.Positive });

    expect(queryOf(QueryKind.Candidates).entity).toBe('response_ratings');
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
    expect(result.response).toMatchObject({ rows: [], total: 0 });
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

    await getConversations({ ...REQUEST, visibleEnrichmentFields: ['session_insights.topic'] });
    const withColumn = JSON.stringify(queryOf(QueryKind.List).select);

    vi.clearAllMocks();
    stub();
    await getConversations({ ...REQUEST, visibleEnrichmentFields: [] });

    expect(withColumn).toContain('session_insights.topic');
    expect(JSON.stringify(queryOf(QueryKind.List).select)).not.toContain('session_insights.topic');
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

describe('getConversations :: an array column filter is resolved before the listing', () => {
  const deployments = (
    operator: ConversationScalarOperator,
    value: string,
  ): ConversationPageRequest['columnFilters'] => [{ field: ConversationsField.Deployments, operator, value }];

  const name = (deployment: string) => ({ [UsageLogField.Deployment]: deployment });

  const predicate = () => JSON.stringify(queryOf(QueryKind.List).filter);

  test('resolves the entered text against the hop log before narrowing the listing', async () => {
    stub({ resolutions: [ok([name('gpt-4o'), name('gpt-4o-mini')])], list: ok([CONVERSATION_ROW]) });

    await getConversations({ ...REQUEST, columnFilters: deployments(ConversationFilterOperator.Contains, 'gpt') });

    const resolution = queryOf(QueryKind.Resolution);
    expect(resolution.entity).toBe(USAGE_LOG_ENTITY);
    expect(resolution.group_by).toEqual([UsageLogField.Deployment]);
    expect(JSON.stringify(resolution.filter)).toContain('gpt');

    expect(predicate()).toContain('array_has_any');
    expect(predicate()).toContain('gpt-4o-mini');
  });

  test('the resolution is issued with the caller token', async () => {
    stub({ resolutions: [ok([name('gpt-4o')])] });

    await getConversations({ ...REQUEST, columnFilters: deployments(ConversationFilterOperator.Contains, 'gpt') });

    expect(execute()).toHaveBeenCalledWith(expect.objectContaining({ entity: USAGE_LOG_ENTITY }), TOKEN_MOCK);
  });

  test('an equals filter skips the resolution entirely', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations({
      ...REQUEST,
      columnFilters: deployments(ConversationFilterOperator.Equals, 'gpt-4o'),
    });

    expect(issued(QueryKind.Resolution)).toHaveLength(0);
    expect(predicate()).toContain('array_has');
    expect(predicate()).toContain('gpt-4o');
  });

  // The set must not be truncated, and the service caps a single read.
  test('pages the resolution until a page comes back short', async () => {
    const full = ok(Array.from({ length: ARRAY_VALUE_PAGE_SIZE }, (_, index) => name(`d${index}`)));
    stub({ resolutions: [full, ok([name('tail')])], list: ok([CONVERSATION_ROW]) });

    await getConversations({ ...REQUEST, columnFilters: deployments(ConversationFilterOperator.Contains, 'd') });

    const offsets = issued(QueryKind.Resolution).map((query) => (query.page as QueryOffsetPage).offset);
    expect(offsets).toEqual([0, ARRAY_VALUE_PAGE_SIZE]);
    expect(predicate()).toContain('tail');
  });

  test('a single short page ends the walk', async () => {
    stub({ resolutions: [ok([name('gpt-4o')])] });

    await getConversations({ ...REQUEST, columnFilters: deployments(ConversationFilterOperator.Contains, 'gpt') });

    expect(issued(QueryKind.Resolution)).toHaveLength(1);
  });

  // No value matched the text, so no conversation does — and the filter is still stated rather than dropped.
  test('text matching no value narrows the result to nothing', async () => {
    stub({ resolutions: [ok([])], list: ok([]) });

    await getConversations({ ...REQUEST, columnFilters: deployments(ConversationFilterOperator.Contains, 'nope') });

    expect(predicate()).toContain('array_length');
    expect(predicate()).not.toContain('array_has');
  });

  // Dropping it would widen the result past what the header states: the operator would read conversations
  // their filter excludes as matches.
  test('a failed resolution fails the page rather than dropping the filter', async () => {
    stub({ resolutions: [failure] });

    const result = await getConversations({
      ...REQUEST,
      columnFilters: deployments(ConversationFilterOperator.Contains, 'gpt'),
    });

    expect(result.success).toBe(false);
    expect(issued(QueryKind.List)).toHaveLength(0);
  });

  test('the first page returns the resolved sets for later pages to carry', async () => {
    stub({ resolutions: [ok([name('gpt-4o')])], list: ok([CONVERSATION_ROW]) });

    const result = await getConversations({
      ...REQUEST,
      columnFilters: deployments(ConversationFilterOperator.Contains, 'gpt'),
    });

    expect(result.response?.arrayFilters).toEqual([
      { field: ConversationsField.Deployments, operator: ConversationFilterOperator.Contains, values: ['gpt-4o'] },
    ]);
  });

  // Resolving again per scroll block would let a later page be narrowed by a different set than the first,
  // and rows would duplicate or vanish across the scroll.
  test('a later page reuses the carried sets instead of resolving again', async () => {
    stub({ list: ok([CONVERSATION_ROW]) });

    await getConversations({
      ...LATER_PAGE,
      columnFilters: deployments(ConversationFilterOperator.Contains, 'gpt'),
      arrayFilters: [
        {
          field: ConversationsField.Deployments,
          operator: ConversationFilterOperator.Contains,
          values: ['carried-name'],
        },
      ],
    });

    expect(issued(QueryKind.Resolution)).toHaveLength(0);
    expect(predicate()).toContain('carried-name');
  });
});

describe('getConversationFieldValues', () => {
  const REQUEST_FOR = (overrides: Partial<ConversationFieldValuesRequest> = {}): ConversationFieldValuesRequest => ({
    ...FILTERS,
    field: ConversationsField.InsightSentiment,
    ...overrides,
  });

  const valueRow = (value: string | null, count: number | string) => ({
    [ConversationsField.InsightSentiment]: value,
    [CONVERSATION_FIELD_VALUE_COUNT_ALIAS]: count,
  });

  test('groups the column and returns each value with its count', async () => {
    stub({ fieldValues: ok([valueRow('positive', 920), valueRow('negative', 41)]) });

    const result = await getConversationFieldValues(REQUEST_FOR());

    expect(queryOf(QueryKind.FieldValues).group_by).toEqual([ConversationsField.InsightSentiment]);
    expect(result.response).toEqual([
      { value: 'positive', count: 920 },
      { value: 'negative', count: 41 },
    ]);
  });

  test('coerces a count the service returned as a string', async () => {
    stub({ fieldValues: ok([valueRow('positive', '920')]) });

    const result = await getConversationFieldValues(REQUEST_FOR());

    expect(result.response).toEqual([{ value: 'positive', count: 920 }]);
  });

  // Null on an enrichment-backed field means the enrichment has not reached that conversation — a statement
  // about coverage rather than one of the enum's values.
  test('drops the group with no value', async () => {
    stub({ fieldValues: ok([valueRow('positive', 920), valueRow(null, 4000), valueRow('', 3)]) });

    const result = await getConversationFieldValues(REQUEST_FOR());

    expect(result.response).toEqual([{ value: 'positive', count: 920 }]);
  });

  test('carries the resolved array sets rather than resolving its own', async () => {
    stub({ fieldValues: ok([valueRow('positive', 1)]) });

    await getConversationFieldValues(
      REQUEST_FOR({
        columnFilters: [
          { field: ConversationsField.Deployments, operator: ConversationFilterOperator.Contains, value: 'gpt' },
        ],
        arrayFilters: [
          {
            field: ConversationsField.Deployments,
            operator: ConversationFilterOperator.Contains,
            values: ['carried-name'],
          },
        ],
      }),
    );

    expect(issued(QueryKind.Resolution)).toHaveLength(0);
    expect(JSON.stringify(queryOf(QueryKind.FieldValues).filter)).toContain('carried-name');
  });

  // An active feedback filter narrows by `in`, so an empty candidate set is the complete answer.
  test('answers nothing without a query when the feedback candidates are empty', async () => {
    stub();

    const result = await getConversationFieldValues(REQUEST_FOR({ feedback: FeedbackFilter.Rated, chatIds: [] }));

    expect(result).toEqual({ success: true, response: [] });
    expect(issued(QueryKind.FieldValues)).toHaveLength(0);
  });

  test('reports a failed read rather than an empty value list', async () => {
    stub({ fieldValues: failure });

    const result = await getConversationFieldValues(REQUEST_FOR());

    expect(result.success).toBe(false);
    expect(result.response).toBeUndefined();
  });
});

describe('getConversationsSchema', () => {
  const getEntitySchema = () => analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;

  test('reads the conversations entity schema with the caller token', async () => {
    getEntitySchema().mockResolvedValue({
      fields: [{ name: 'success_count', type: 'integer', source: 'success_count' }],
    });

    const result = await getConversationsSchema();

    expect(getEntitySchema()).toHaveBeenCalledWith('sessions', TOKEN_MOCK);
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

describe('the hop inspector reads', () => {
  const CHAT_ID = 'chat-1';
  const getEntitySchema = () => analyticsDataApi.getEntitySchema as unknown as ReturnType<typeof vi.fn>;
  const READABLE = [UsageLogField.RequestBody, UsageLogField.ResponseBody];

  const schemaOf = (names: string[]) =>
    getEntitySchema().mockResolvedValue({ fields: names.map((name) => ({ name, type: 'string', source: name })) });

  const bodyRow = (overrides: Record<string, unknown> = {}) => ({
    trace_id: 'tr1',
    event_kind: 'llm_call',
    request_uri: '/openai/deployments/gpt/chat/completions',
    request_body: JSON.stringify({
      temperature: 0,
      messages: [
        { role: 'system', content: 'you are a quartermaster' },
        { role: 'user', content: 'the prompt' },
      ],
    }),
    response_body: JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: 'the answer' } }] }),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    clearEntitySchemaCache();
    (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  const readRequest = (requestTime: number | string | null = 1787052797216) =>
    getConversationHopRequest(CHAT_ID, 'tr1', 'sp1', requestTime);

  // Tier 1: roles, positions, sizes and clamped texts cross to the browser; the body does not.
  test('ships an envelope and no raw body', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const result = await readRequest();

    expect(result.response?.state).toBe(HopReadState.Available);
    expect(result.response?.messages.map(({ role }) => role)).toEqual([MessageRole.System, MessageRole.User]);
    expect(JSON.stringify(result.response)).not.toContain('choices');
  });

  // The rule this change reverses: the system prompt is what a reader opening a hop to debug it is asking
  // about, and every message is labelled with its own role so nothing reads as something a person typed.
  test('states the system message rather than withholding it', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const [system] = (await readRequest()).response?.messages ?? [];

    expect(system.role).toBe(MessageRole.System);
    expect(system.text).toBe('you are a quartermaster');
  });

  test('states a zero temperature rather than reporting it absent', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const params = (await readRequest()).response?.params.stated ?? [];

    expect(params.find(({ name }) => name === 'temperature')?.value).toBe('0');
  });

  // A dialect no parser claims is answered with the raw body rather than with a wrong message list.
  test('reports an unparseable dialect as unstructured', async () => {
    schemaOf(READABLE);
    // `/v1/completions` rather than `/v1/responses`: the latter has a parser now, and this scenario is about
    // an endpoint no parser claims.
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow({ request_uri: '/v1/completions' })] } });

    expect((await readRequest()).response?.state).toBe(HopReadState.Unstructured);
  });

  // One hop at a time: the query names the hop, and the bound is its own instant.
  test('reads exactly the one hop it was asked for', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    await readRequest();

    const query = execute().mock.calls[0][0] as StructuredQuery;
    expect(JSON.stringify(query.filter)).toContain('sp1');
    expect(JSON.stringify(query.filter)).toContain('1787052797216');
    expect(execute()).toHaveBeenCalledOnce();
    expect(execute()).toHaveBeenCalledWith(expect.anything(), TOKEN_MOCK);
  });

  // Entitlement is per side: a caller holding the request column must not have the response column named in
  // their query, because an unknown field rejects the whole read.
  test('names only the body column the caller holds', async () => {
    schemaOf([UsageLogField.RequestBody]);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    await readRequest();

    const query = execute().mock.calls[0][0] as StructuredQuery;
    expect(JSON.stringify(query.select)).toContain(UsageLogField.RequestBody);
    expect(JSON.stringify(query.select)).not.toContain(UsageLogField.ResponseBody);
  });

  test('a side the caller does not hold is withheld without reading anything', async () => {
    schemaOf([UsageLogField.RequestBody]);

    const result = await getConversationHopResponse(CHAT_ID, 'tr1', 'sp1', 1);

    expect(result.success).toBe(true);
    expect(result.response?.state).toBe(HopReadState.ColumnWithheld);
    expect(execute()).not.toHaveBeenCalled();
  });

  // A schema that could not be read is an outage, not a column that was withheld.
  test('reports a failure when the schema could not be read', async () => {
    getEntitySchema().mockResolvedValue(null);

    const result = await readRequest();

    expect(result.success).toBe(false);
    expect(result.response?.state).toBe(HopReadState.LoadFailed);
  });

  test('reports a failed read as a failure rather than as an empty hop', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: false, response: undefined });

    expect((await readRequest()).response?.state).toBe(HopReadState.LoadFailed);
  });

  test('reports a hop the read matched no row for', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [] } });

    const result = await readRequest();

    expect(result.success).toBe(true);
    expect(result.response?.state).toBe(HopReadState.NoBody);
  });

  test('reports a request that recorded no messages as empty', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow({ request_body: null })] } });

    expect((await readRequest()).response?.state).toBe(HopReadState.NoBody);
  });

  // Tier 2 returns one message in full and nothing beside it — not the whole body, and not a neighbouring
  // message's text alongside.
  test('returns a single message in full', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const result = await getConversationHopMessage(CHAT_ID, 'tr1', 'sp1', 1, 1);

    expect(result.response?.text).toBe('the prompt');
    expect(JSON.stringify(result.response)).not.toContain('quartermaster');
  });

  test('reports an index the body does not carry rather than throwing', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    expect((await getConversationHopMessage(CHAT_ID, 'tr1', 'sp1', 1, 9)).response?.state).toBe(HopReadState.NoBody);
  });

  // An assistant message that only called a tool: the call is what it said, so tier 2 carries it.
  test('returns an assistant call as the message content', async () => {
    schemaOf(READABLE);
    const withCall = JSON.stringify({
      messages: [
        { role: 'assistant', content: '', tool_calls: [{ function: { name: 'calc', arguments: '{"a":1}' } }] },
      ],
    });
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow({ request_body: withCall })] } });

    const result = await getConversationHopMessage(CHAT_ID, 'tr1', 'sp1', 1, 0);

    // The tier-2 read of one message carries the call's id for the same reason the envelope does.
    expect(result.response?.toolCalls).toEqual([{ name: 'calc', args: '{"a":1}', id: null }]);
  });

  // Tier 3 clamps and states both sizes: silent truncation produces a reader who believes they read it all.
  test('clamps the raw body and states what was withheld', async () => {
    schemaOf(READABLE);
    const huge = 'x'.repeat(RAW_BODY_BYTE_BUDGET + 50);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow({ request_body: huge })] } });

    const result = await getConversationHopRawBody(CHAT_ID, 'tr1', 'sp1', 1, HopInspectorSide.Request);

    expect(result.response?.clamp).toEqual({
      isClamped: true,
      recordedBytes: RAW_BODY_BYTE_BUDGET + 50,
      deliveredBytes: RAW_BODY_BYTE_BUDGET,
    });
  });

  test('states the assembled response and its finish reason', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    const result = await getConversationHopResponse(CHAT_ID, 'tr1', 'sp1', 1);

    expect(result.response?.text).toBe('the answer');
    expect(result.response?.finishReason).toBe('stop');
  });

  test('sends no time bound for a hop that records no time', async () => {
    schemaOf(READABLE);
    execute().mockResolvedValue({ success: true, response: { rows: [bodyRow()] } });

    await readRequest(null);

    const query = execute().mock.calls[0][0] as StructuredQuery;
    // Matched as an operator rather than as a substring: the identity enrichment's column name contains
    // "ge" (usa*ge*_client_identity), so a bare `toContain` passes for the wrong reason.
    expect(JSON.stringify(query.filter)).not.toContain(`"op":"${QueryOperator.Ge}"`);
  });
});
