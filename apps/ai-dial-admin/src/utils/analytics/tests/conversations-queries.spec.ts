import { describe, expect, test } from 'vitest';

import {
  CHAT_ID_SESSION_SOURCE,
  CONVERSATION_HOP_COUNT_ALIAS,
  FEEDBACK_CANDIDATE_LIMIT,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationColumnFilter,
  ConversationEntryHopRow,
  ConversationFilterOperator,
  ConversationRatingTotalsField,
  ConversationTotalsField,
  ConversationsField,
  FeedbackField,
  FeedbackFilter,
  ResponseRatingsField,
  UsageLogField,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';
import {
  QueryExprType,
  QueryFieldExpr,
  QueryFnExpr,
  QueryGroup,
  QueryLogicalOperator,
  QueryMode,
  QueryOffsetPage,
  QueryOperator,
  QueryOutputColumn,
  QueryPredicate,
  QuerySortDirection,
  QuerySortNulls,
  QueryValueExpr,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import {
  buildConversationEntryBodiesQuery,
  buildConversationHopBodyQuery,
  buildConversationEntryHopsQuery,
  buildConversationHopCountQuery,
  buildConversationListQuery,
  buildConversationRatingCountsQuery,
  buildConversationRatingsQuery,
  buildConversationRatingTotalsQuery,
  buildConversationTotalsQuery,
  buildRatedConversationIdsQuery,
} from '@/src/utils/analytics/conversations-queries';

const RANGE: TimeRange = {
  startDate: new Date('2026-07-21T00:00:00.000Z'),
  endDate: new Date('2026-07-28T00:00:00.000Z'),
};

const START_MS = '1784592000000';
const END_MS = '1785196800000';

const PAGE = { offset: 0, limit: 100 };

const groupArgs = (filter: unknown): QueryPredicate[] => (filter as QueryGroup).args as QueryPredicate[];

const fieldName = (node: QueryPredicate): string | undefined => (node.args?.[0] as QueryFieldExpr)?.name;

const buildList = (overrides: Partial<Parameters<typeof buildConversationListQuery>[0]> = {}) =>
  buildConversationListQuery({ range: RANGE, ...PAGE, ...overrides });

const selectNames = (query: StructuredQuery): string[] =>
  (query.select as QueryOutputColumn[]).map((column) => (column.expr as QueryFieldExpr).name);

describe('buildConversationListQuery :: shape', () => {
  test('reads the materialized conversations entity in row mode', () => {
    const query = buildList();

    expect(query.entity).toBe('sessions');
    expect(query.mode).toBe(QueryMode.Row);
  });

  // The rollup is stored, so nothing is recomputed per request.
  test('never groups and never aggregates', () => {
    const query = buildList();

    expect(query.group_by).toBeUndefined();
    expect(query.having).toBeUndefined();
    expect(JSON.stringify(query.select)).not.toContain(QueryExprType.Fn);
  });

  // With a schema in hand only row identity is unconditional: every other field a column reads arrives
  // classified by cost, so a curated field the service later marks heavy is gated like any other.
  test('names only row identity unconditionally once the caller has classified fields', () => {
    const names = selectNames(buildList({ sourceFields: ['project_id', 'total_price'] }));

    expect(names).toEqual([ConversationsField.ChatId, 'project_id', 'total_price']);
    expect(names).not.toContain(ConversationsField.TurnCount);
    expect(names).not.toContain(ConversationsField.Deployments);
  });

  test('does not name row identity twice when the caller also classifies it', () => {
    const names = selectNames(buildList({ sourceFields: [ConversationsField.ChatId, 'total_price'] }));

    expect(names.filter((name) => name === ConversationsField.ChatId)).toHaveLength(1);
  });

  // Without a schema there are no buckets to classify from, and the curated columns still render — so the
  // base rollup columns are named rather than left to show empty cells.
  test('selects exactly the fields the grid renders, by their entity names', () => {
    const names = selectNames(buildList());

    expect(names).toEqual([
      ConversationsField.ChatId,
      ConversationsField.ProjectId,
      ConversationsField.UserHash,
      ConversationsField.TurnCount,
      ConversationsField.TotalTokens,
      ConversationsField.TotalPrice,
      ConversationsField.LastRequestTime,
      ConversationsField.FirstRequestTime,
      ConversationsField.Deployments,
    ]);
  });

  // The title is an enrichment column, so it reaches the select the way every enrichment field does — while
  // its column is visible — and by its qualified flat name, sent whole rather than as a path.
  test('names the title by its qualified flat name while its column is visible', () => {
    const names = selectNames(buildList({ visibleEnrichmentFields: [ConversationsField.InsightTitle] }));

    expect(names).toContain('session_insights.title');
  });

  test('leaves the hidden curated enrichment columns out of the default projection', () => {
    const names = selectNames(buildList());

    for (const hidden of [
      ConversationsField.InsightTitle,
      ConversationsField.InsightSentiment,
      ConversationsField.InsightTopic,
      ConversationsField.Traces,
    ]) {
      expect(names).not.toContain(hidden);
    }
  });

  test('projects a curated enrichment column once it is visible', () => {
    const names = selectNames(buildList({ visibleEnrichmentFields: [ConversationsField.InsightSentiment] }));

    expect(names).toContain(ConversationsField.InsightSentiment);
  });

  // The query language expresses no comparison over an array, so translating a predicate on one would send
  // the backend something it rejects — better to refuse it here than to approximate it.
  test('refuses a column filter naming an array field rather than approximating one', () => {
    expect(() =>
      buildList({
        columnFilters: [
          {
            field: ConversationsField.Deployments,
            operator: ConversationFilterOperator.Contains,
            value: 'gpt-4.1',
          },
        ],
      }),
    ).toThrow(ConversationsField.Deployments);
  });

  test('projects a source-backed field alongside the curated ones, hidden or not', () => {
    const names = selectNames(buildList({ sourceFields: ['success_count'] }));

    expect(names).toContain('success_count');
    expect(names).toContain(ConversationsField.ChatId);
  });

  test('projects an enrichment-backed field only while its column is visible', () => {
    const visible = selectNames(buildList({ visibleEnrichmentFields: ['session_insights.topic'] }));

    expect(visible).toContain('session_insights.topic');
    expect(selectNames(buildList())).not.toContain('session_insights.topic');
  });

  test('names a curated field once even when it is reported as a source field', () => {
    const names = selectNames(buildList({ sourceFields: [ConversationsField.ChatId] }));

    expect(names.filter((name) => name === ConversationsField.ChatId)).toHaveLength(1);
  });

  test('aliases nothing — a stored column needs no rename', () => {
    (buildList().select as QueryOutputColumn[]).forEach((column) => expect(column.as).toBeUndefined());
  });

  // dial_usage_log columns belong to a different entity and would be rejected as unknown fields, as would a
  // column invented by the frontend. The rollup's own enrichment columns are named, by their flat names.
  test('references no column of the usage log and no invented one', () => {
    const serialized = JSON.stringify(buildList({ search: 'acme' }));

    ['request_time', 'trace_id', 'deployment', 'request_body', 'conversation_summary', 'title', 'snippet'].forEach(
      // Matched as a whole field name: `last_request_time` legitimately contains `request_time`.
      (column) => expect(serialized).not.toContain(`"${column}"`),
    );
  });
});

describe('buildConversationListQuery :: filter', () => {
  test('bounds last activity, not the underlying request time', () => {
    const args = groupArgs(buildList().filter);
    const bounds = args.filter((node) => [QueryOperator.Ge, QueryOperator.Le].includes(node.op));

    expect(bounds.map(fieldName)).toEqual([ConversationsField.LastRequestTime, ConversationsField.LastRequestTime]);
    expect(bounds.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual([START_MS, END_MS]);
    expect(bounds.map((node) => (node.args[1] as QueryValueExpr).value_type)).toEqual([
      QueryValueType.Timestamp,
      QueryValueType.Timestamp,
    ]);
  });

  test('is a flat AND carrying only the bounds when nothing else is filtered', () => {
    expect((buildList().filter as QueryGroup).op).toBe(QueryLogicalOperator.And);
    expect(groupArgs(buildList().filter)).toHaveLength(2);
  });

  // The pipeline's own membership predicate excludes empty ids, so every row already has one.
  test('emits no empty-id guard', () => {
    const args = groupArgs(buildList().filter);

    expect(args.some((node) => node.op === QueryOperator.Ne)).toBe(false);
  });
});

describe('buildConversationListQuery :: search', () => {
  const searchGroup = (search: string): QueryGroup =>
    groupArgs(buildList({ search }).filter).find(
      (node) => (node as unknown as QueryGroup).op === QueryLogicalOperator.Or,
    ) as unknown as QueryGroup;

  test('a term becomes one OR of two contains predicates on the id and the project', () => {
    const group = searchGroup('acme');
    const predicates = group.args as QueryPredicate[];

    expect(predicates).toHaveLength(2);
    expect(predicates.map((node) => node.op)).toEqual([QueryOperator.Ico, QueryOperator.Ico]);
    expect(predicates.map(fieldName)).toEqual([ConversationsField.ChatId, ConversationsField.ProjectId]);
    expect(predicates.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual(['acme', 'acme']);
  });

  test('search does not reach the user hash', () => {
    const predicates = searchGroup('acme').args as QueryPredicate[];

    expect(predicates.map(fieldName)).not.toContain(ConversationsField.UserHash);
  });

  test('the term is trimmed', () => {
    const predicates = searchGroup('  acme  ').args as QueryPredicate[];

    expect(predicates.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual(['acme', 'acme']);
  });

  // An ico against '' matches every row at the cost of a scan, so a blank term must add nothing at all.
  test.each(['', '   '])('a blank term (%s) adds no predicate', (search) => {
    expect(groupArgs(buildList({ search }).filter)).toHaveLength(2);
    expect(searchGroup(search)).toBeUndefined();
  });

  test('search leaves the rest of the query untouched', () => {
    const withSearch = buildList({ search: 'acme' });
    const without = buildList();

    expect(withSearch.select).toEqual(without.select);
    expect(withSearch.sort).toEqual(without.sort);
    expect(withSearch.page).toEqual(without.page);
    expect(withSearch.having).toBeUndefined();
    expect(groupArgs(withSearch.filter).slice(0, 2)).toEqual(groupArgs(without.filter));
  });
});

describe('buildConversationListQuery :: column filters', () => {
  const predicateFor = (columnFilters: ConversationColumnFilter[]) =>
    groupArgs(buildList({ columnFilters }).filter).slice(2);

  test.each([
    [ConversationFilterOperator.Contains, QueryOperator.Ico],
    [ConversationFilterOperator.NotContains, QueryOperator.Inc],
    [ConversationFilterOperator.Equals, QueryOperator.Eq],
    [ConversationFilterOperator.NotEquals, QueryOperator.Ne],
  ])('a %s filter conjoins a %s predicate', (operator, expected) => {
    const [node] = predicateFor([{ field: ConversationsField.ProjectId, operator, value: 'acme' }]);

    expect(node.op).toBe(expected);
    expect(fieldName(node)).toBe(ConversationsField.ProjectId);
    expect((node.args[1] as QueryValueExpr).value).toBe('acme');
  });

  test.each([
    [ConversationFilterOperator.GreaterThan, QueryOperator.Gt],
    [ConversationFilterOperator.GreaterThanOrEqual, QueryOperator.Ge],
    [ConversationFilterOperator.LessThan, QueryOperator.Lt],
    [ConversationFilterOperator.LessThanOrEqual, QueryOperator.Le],
  ])('a %s filter conjoins a %s predicate', (operator, expected) => {
    const [node] = predicateFor([{ field: ConversationsField.TurnCount, operator, value: '5' }]);

    expect(node.op).toBe(expected);
  });

  test('a range becomes a ge and an le on the same field', () => {
    const [group] = predicateFor([
      {
        field: ConversationsField.TotalTokens,
        operator: ConversationFilterOperator.Range,
        value: '10',
        valueTo: '20',
      },
    ]);
    const bounds = (group as unknown as QueryGroup).args as QueryPredicate[];

    expect(bounds.map((node) => node.op)).toEqual([QueryOperator.Ge, QueryOperator.Le]);
    expect(bounds.map(fieldName)).toEqual([ConversationsField.TotalTokens, ConversationsField.TotalTokens]);
    expect(bounds.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual(['10', '20']);
  });

  test.each([
    [ConversationsField.ChatId, QueryValueType.String],
    [ConversationsField.TurnCount, QueryValueType.Integer],
    [ConversationsField.TotalPrice, QueryValueType.Decimal],
  ])('a filter on %s carries the %s value type', (targetField, valueType) => {
    const [node] = predicateFor([
      { field: targetField, operator: ConversationFilterOperator.Equals, value: '0.090000000001' },
    ]);

    expect((node.args[1] as QueryValueExpr).value_type).toBe(valueType);
  });

  test('no column filter leaves the filter as the bounds alone', () => {
    expect(groupArgs(buildList({ columnFilters: [] }).filter)).toHaveLength(2);
  });

  test('column filters compose with the search term and the time bounds', () => {
    const args = groupArgs(
      buildList({
        search: 'acme',
        columnFilters: [
          { field: ConversationsField.TurnCount, operator: ConversationFilterOperator.GreaterThan, value: '2' },
        ],
      }).filter,
    );

    expect(args).toHaveLength(4);
    expect(args.at(-1)?.op).toBe(QueryOperator.Gt);
  });
});

describe('buildConversationListQuery :: feedback narrowing by chat id', () => {
  test('narrows by an in predicate over the candidate ids', () => {
    const node = groupArgs(buildList({ chatIds: ['a', 'b'] }).filter).find((arg) => arg.op === QueryOperator.In);

    expect(fieldName(node as QueryPredicate)).toBe(ConversationsField.ChatId);
    expect(node?.args[1]).toEqual({
      type: QueryExprType.Array,
      items: [
        { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'a' },
        { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'b' },
      ],
    });
  });

  // The service rejects an empty in list with a 400, and "no candidates" is answered without a query.
  test('an empty id list adds no in predicate', () => {
    expect(groupArgs(buildList({ chatIds: [] }).filter).some((node) => node.op === QueryOperator.In)).toBe(false);
  });

  test('narrowing composes with search and the time bounds', () => {
    const args = groupArgs(buildList({ search: 'acme', chatIds: ['a'] }).filter);

    expect(args.filter((node) => [QueryOperator.Ge, QueryOperator.Le].includes(node.op))).toHaveLength(2);
    expect(args.some((node) => (node as unknown as QueryGroup).op === QueryLogicalOperator.Or)).toBe(true);
    expect(args.some((node) => node.op === QueryOperator.In)).toBe(true);
  });
});

describe('buildConversationListQuery :: sort, page and purity', () => {
  test('orders by last activity with a stable id tiebreaker last when no caller key is given', () => {
    const sort = buildList().sort;

    expect(sort).toEqual([
      { field: ConversationsField.LastRequestTime, dir: QuerySortDirection.Desc },
      { field: ConversationsField.ChatId, dir: QuerySortDirection.Asc },
    ]);
    expect(sort?.at(-1)?.field).toBe(ConversationsField.ChatId);
  });

  test('puts a caller sort key before the tiebreaker and orders its nulls last', () => {
    const sort = buildList({
      sort: [{ field: ConversationsField.TotalPrice, direction: QuerySortDirection.Desc }],
    }).sort;

    expect(sort).toEqual([
      { field: ConversationsField.TotalPrice, dir: QuerySortDirection.Desc, nulls: QuerySortNulls.Last },
      { field: ConversationsField.ChatId, dir: QuerySortDirection.Asc },
    ]);
  });

  test('appends the tiebreaker even when the caller sorts by the id itself', () => {
    const sort = buildList({
      sort: [{ field: ConversationsField.ChatId, direction: QuerySortDirection.Desc }],
    }).sort;

    expect(sort).toHaveLength(2);
    expect(sort?.at(-1)).toEqual({ field: ConversationsField.ChatId, dir: QuerySortDirection.Asc });
  });

  test('keeps several caller keys in order, each with a nulls ordering', () => {
    const sort = buildList({
      sort: [
        { field: ConversationsField.ProjectId, direction: QuerySortDirection.Asc },
        { field: ConversationsField.TotalTokens, direction: QuerySortDirection.Desc },
      ],
    }).sort;

    expect(sort?.map((item) => item.field)).toEqual([
      ConversationsField.ProjectId,
      ConversationsField.TotalTokens,
      ConversationsField.ChatId,
    ]);
    expect(sort?.slice(0, 2).every((item) => item.nulls === QuerySortNulls.Last)).toBe(true);
  });

  // The totals query resolves the same count under the same filter, and the service runs a requested
  // total as its own statement over the whole filtered result — so asking here would scan it per page.
  test('requests no total and carries the caller offset and limit', () => {
    expect(buildList().page).toEqual({ type: 'offset', offset: 0, limit: 100, include_total: false });
    expect(buildList({ offset: 200, limit: 100 }).page).toMatchObject({ offset: 200, limit: 100 });
  });

  test('a limit above the service maximum is never produced by the page defaults', () => {
    expect((buildList().page as QueryOffsetPage).limit).toBeLessThanOrEqual(1000);
  });

  test('is pure — same inputs, same query, and it never reads the clock', () => {
    expect(buildList({ search: 'acme' })).toEqual(buildList({ search: 'acme' }));
    expect(buildList({ offset: 100, limit: 100 })).not.toEqual(buildList());
  });
});

describe('buildConversationTotalsQuery', () => {
  const buildTotals = () => buildConversationTotalsQuery(RANGE);

  test('counts conversations and sums cost over the period', () => {
    const query = buildTotals();

    expect(query.entity).toBe('sessions');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toBeUndefined();
    expect(query.select).toEqual([
      { expr: { type: QueryExprType.Fn, name: 'count', args: [] }, as: ConversationTotalsField.Conversations },
      {
        expr: {
          type: QueryExprType.Fn,
          name: 'sum',
          args: [{ type: QueryExprType.Field, name: ConversationsField.TotalPrice }],
        },
        as: ConversationTotalsField.Cost,
      },
    ]);
  });

  test('takes no page and no sort — one row is the whole answer', () => {
    expect(buildTotals().page).toBeUndefined();
    expect(buildTotals().sort).toBeUndefined();
  });

  // A search or column predicate reaching here would silently make the pills a summary of the filtered result.
  test('carries the period alone — every predicate is a bound on the time field', () => {
    const args = groupArgs(buildTotals().filter);

    expect(args).toHaveLength(2);
    args.forEach((node) => {
      expect(fieldName(node)).toBe(ConversationsField.LastRequestTime);
      expect([QueryOperator.Ge, QueryOperator.Le]).toContain(node.op);
    });
  });

  test('is narrower than the list query whenever the list is filtered', () => {
    expect(buildTotals().filter).not.toEqual(buildList({ search: 'acme' }).filter);
    expect(buildTotals().filter).not.toEqual(buildList({ chatIds: ['a'] }).filter);
  });
});

describe('buildConversationRatingTotalsQuery', () => {
  const build = (feedback: FeedbackFilter) => buildConversationRatingTotalsQuery({ range: RANGE, feedback });

  test('counts distinct conversations, not rate events', () => {
    const query = build(FeedbackFilter.Rated);

    expect(query.entity).toBe('response_ratings');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.select).toEqual([
      {
        expr: {
          type: QueryExprType.Fn,
          name: 'count',
          args: [{ type: QueryExprType.Field, name: ResponseRatingsField.ChatId }],
          distinct: true,
        },
        as: ConversationRatingTotalsField.Conversations,
      },
    ]);
  });

  test('groups by nothing and takes no page — one row is the whole answer', () => {
    expect(build(FeedbackFilter.Rated).group_by).toBeUndefined();
    expect(build(FeedbackFilter.Rated).page).toBeUndefined();
  });

  test('bounds the count by the rating clock, not the conversation clock', () => {
    const bounds = groupArgs(build(FeedbackFilter.Rated).filter).filter((node) =>
      [QueryOperator.Ge, QueryOperator.Le].includes(node.op),
    );

    expect(bounds).toHaveLength(2);
    bounds.forEach((node) => expect(fieldName(node)).toBe(ResponseRatingsField.LastRateTime));
  });

  // Half of all rate events carry no chat id — direct API calls, not conversations.
  test('excludes rate events carrying no conversation id', () => {
    const guard = groupArgs(build(FeedbackFilter.Rated).filter).find(
      (node) => node.op === QueryOperator.Ne && fieldName(node) === ResponseRatingsField.ChatId,
    );

    expect(guard).toBeDefined();
  });

  test('the rated and negative counts ask different questions of the same rows', () => {
    expect(build(FeedbackFilter.Rated).filter).not.toEqual(build(FeedbackFilter.Negative).filter);
  });

  test('is pure — same inputs, same query, and it never reads the clock', () => {
    expect(build(FeedbackFilter.Negative)).toEqual(build(FeedbackFilter.Negative));
  });
});

describe('buildRatedConversationIdsQuery', () => {
  const build = (feedback: FeedbackFilter) => buildRatedConversationIdsQuery({ range: RANGE, feedback });

  const filterArgs = (feedback: FeedbackFilter) => groupArgs(build(feedback).filter);

  const rateNode = (feedback: FeedbackFilter) =>
    filterArgs(feedback).find(
      (node) =>
        String(node.op) === QueryLogicalOperator.Or ||
        (fieldName(node) !== undefined && fieldName(node) !== ResponseRatingsField.ChatId && !isTimeBound(node)),
    );

  const isTimeBound = (node: QueryPredicate) =>
    [QueryOperator.Ge, QueryOperator.Le].includes(node.op) && fieldName(node) === ResponseRatingsField.LastRateTime;

  const RATED_STATES = [FeedbackFilter.Positive, FeedbackFilter.Negative, FeedbackFilter.Rated];

  test.each(RATED_STATES)('%s targets the rating rollup grouped by chat_id', (feedback) => {
    const query = build(feedback);

    expect(query.entity).toBe('response_ratings');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual([ResponseRatingsField.ChatId]);
  });

  test('selects the conversation id and its most recent rating time', () => {
    const query = build(FeedbackFilter.Rated);

    expect(query.select?.[0]).toEqual({ expr: { type: QueryExprType.Field, name: ResponseRatingsField.ChatId } });
    expect(query.select?.[1].as).toBe(FeedbackField.LastRated);
    expect(query.select?.[1].expr).toMatchObject({
      name: 'max',
      args: [{ type: QueryExprType.Field, name: ResponseRatingsField.LastRateTime }],
    });
  });

  test.each(RATED_STATES)('%s references no unqueryable column', (feedback) => {
    const serialized = JSON.stringify(build(feedback));

    ['comment_sample', 'comments', 'trace_id', 'core_span_id', '_updated_at'].forEach((column) => {
      expect(serialized).not.toContain(column);
    });
  });

  test('Positive selects on the positive count alone', () => {
    expect(rateNode(FeedbackFilter.Positive)).toEqual({
      op: QueryOperator.Gt,
      args: [
        { type: QueryExprType.Field, name: ResponseRatingsField.RatePosCount },
        { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '0' },
      ],
    });
  });

  test('Negative is a union over the non-positive counts, zero included', () => {
    const node = rateNode(FeedbackFilter.Negative) as unknown as QueryGroup;

    expect(String(node.op)).toBe(QueryLogicalOperator.Or);
    expect((node.args as QueryPredicate[]).map(fieldName)).toEqual([
      ResponseRatingsField.RateZeroCount,
      ResponseRatingsField.RateNegCount,
    ]);
    (node.args as QueryPredicate[]).forEach((arg) => expect(arg.op).toBe(QueryOperator.Gt));
  });

  test('Rated is a union over every value-bearing count', () => {
    const node = rateNode(FeedbackFilter.Rated) as unknown as QueryGroup;

    expect(String(node.op)).toBe(QueryLogicalOperator.Or);
    expect((node.args as QueryPredicate[]).map(fieldName)).toEqual([
      ResponseRatingsField.RatePosCount,
      ResponseRatingsField.RateZeroCount,
      ResponseRatingsField.RateNegCount,
    ]);
  });

  test('Rated names no column that could hold a rate event without a value', () => {
    const serialized = JSON.stringify(build(FeedbackFilter.Rated));

    expect(serialized).not.toContain(ResponseRatingsField.RateEventCount);
    expect(serialized).not.toContain('rate_null_count');
  });

  test.each(RATED_STATES)('%s bounds last_rate_time, guards empty ids and stays a flat AND of four', (feedback) => {
    const args = filterArgs(feedback);
    const bounds = args.filter(isTimeBound);
    const guard = args.find((node) => node.op === QueryOperator.Ne && fieldName(node) === ResponseRatingsField.ChatId);

    expect(bounds.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual([START_MS, END_MS]);
    expect((guard?.args[1] as QueryValueExpr).value).toBe('');
    expect((build(feedback).filter as QueryGroup).op).toBe(QueryLogicalOperator.And);
    expect(args).toHaveLength(4);
  });

  test('All adds no rate predicate', () => {
    expect(filterArgs(FeedbackFilter.All)).toHaveLength(3);
  });

  // The candidate set is capped, so ordering by most recent rating keeps the rows the page is likeliest to show.
  test('orders by most recent rating with a stable tiebreaker, capped at the service maximum', () => {
    const query = build(FeedbackFilter.Rated);

    expect(query.sort).toEqual([
      { field: FeedbackField.LastRated, dir: QuerySortDirection.Desc },
      { field: ResponseRatingsField.ChatId, dir: QuerySortDirection.Asc },
    ]);
    expect(query.page).toEqual({ type: 'offset', offset: 0, limit: FEEDBACK_CANDIDATE_LIMIT, include_total: false });
    expect(FEEDBACK_CANDIDATE_LIMIT).toBeLessThanOrEqual(1000);
  });

  test('varies only by feedback state for a fixed range', () => {
    expect(build(FeedbackFilter.Positive)).toEqual(build(FeedbackFilter.Positive));
    expect(build(FeedbackFilter.Positive)).not.toEqual(build(FeedbackFilter.Negative));
  });
});

describe('buildConversationRatingsQuery', () => {
  const build = (chatIds = ['a', 'b']) => buildConversationRatingsQuery({ range: RANGE, chatIds });

  const summed = (query: StructuredQuery) =>
    (query.select as QueryOutputColumn[]).slice(1).map((column) => ({
      as: column.as,
      field: ((column.expr as QueryFnExpr).args?.[0] as QueryFieldExpr)?.name,
      fn: (column.expr as QueryFnExpr).name,
    }));

  test('reads the rating rollup grouped by chat_id, restricted to the ids given', () => {
    const query = build();

    expect(query.entity).toBe('response_ratings');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual([ResponseRatingsField.ChatId]);
    expect(query.select?.[0]).toEqual({ expr: { type: QueryExprType.Field, name: ResponseRatingsField.ChatId } });
    expect(groupArgs(query.filter).find((node) => node.op === QueryOperator.In)?.args[1]).toMatchObject({
      type: QueryExprType.Array,
    });
  });

  test('answers both directions from one query', () => {
    expect(summed(build())).toEqual([
      { as: FeedbackField.RatingUp, field: ResponseRatingsField.RatePosCount, fn: 'sum' },
      { as: FeedbackField.RateZero, field: ResponseRatingsField.RateZeroCount, fn: 'sum' },
      { as: FeedbackField.RateNegative, field: ResponseRatingsField.RateNegCount, fn: 'sum' },
      { as: FeedbackField.RateBoolFalse, field: ResponseRatingsField.RateBoolFalseCount, fn: 'sum' },
      { as: FeedbackField.RateRaw, field: ResponseRatingsField.RateRawCount, fn: 'sum' },
      { as: FeedbackField.RateEvents, field: ResponseRatingsField.RateEventCount, fn: 'sum' },
    ]);
  });

  test('projects the form columns the negative figure caveat is drawn from', () => {
    const aliases = summed(build()).map((column) => column.as);

    expect(aliases).toContain(FeedbackField.RateBoolFalse);
    expect(aliases).toContain(FeedbackField.RateRaw);
  });

  test('carries no rate predicate of its own', () => {
    const args = groupArgs(build().filter);

    expect(args.map(fieldName)).toEqual([
      ResponseRatingsField.LastRateTime,
      ResponseRatingsField.LastRateTime,
      ResponseRatingsField.ChatId,
    ]);
  });

  test('bounds last_rate_time to the selected period', () => {
    const bounds = groupArgs(build().filter).filter((node) => fieldName(node) === ResponseRatingsField.LastRateTime);

    expect(bounds.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual([START_MS, END_MS]);
  });

  // Restricted to the page's ids, so the limit tracks that count — a cap below it would silently report a
  // displayed conversation as unrated.
  test('pages for exactly the ids requested, never zero', () => {
    expect((build(['a', 'b', 'c']).page as QueryOffsetPage).limit).toBe(3);
    expect((build([]).page as QueryOffsetPage).limit).toBe(1);
  });
});

describe('buildConversationRatingCountsQuery', () => {
  const build = () => buildConversationRatingCountsQuery('chat-1');

  test('narrows to one conversation by equality and requests a single row', () => {
    const query = build();
    const predicate = query.filter as QueryPredicate;

    expect(query.entity).toBe('response_ratings');
    expect(query.group_by).toEqual([ResponseRatingsField.ChatId]);
    expect(predicate.op).toBe(QueryOperator.Eq);
    expect(fieldName(predicate)).toBe(ResponseRatingsField.ChatId);
    expect((query.page as QueryOffsetPage).limit).toBe(1);
  });

  test('carries no time bound', () => {
    expect(JSON.stringify(build())).not.toContain(ResponseRatingsField.LastRateTime);
  });

  test('projects the same figures the grid column reads', () => {
    const aliases = (build().select as QueryOutputColumn[]).slice(1).map((column) => column.as);

    expect(aliases).toEqual([
      FeedbackField.RatingUp,
      FeedbackField.RateZero,
      FeedbackField.RateNegative,
      FeedbackField.RateBoolFalse,
      FeedbackField.RateRaw,
      FeedbackField.RateEvents,
    ]);
  });
});

// A chat-origin session: its id came from a conversation header, so every hop-log read for it keeps the
// bloom-filtered `chat_id`. `AGENT_SCOPE` is the other half of that contract.
const CHAT_ID: SessionScope = { id: 'chat-1', source: CHAT_ID_SESSION_SOURCE };
const AGENT_SCOPE: SessionScope = { id: 'cc-session-1', source: 'x-claude-code-session-id' };

const hopRow = (traceId: string, requestTime: number | string | null): ConversationEntryHopRow => ({
  trace_id: traceId,
  request_time: requestTime,
  deployment: 'app',
  number_request_messages: 1,
  request_body_bytes: 10,
  response_body_bytes: 20,
});

const HOPS = [hopRow('t1', 1787218895000), hopRow('t2', 1787220824000)];

const BODY_COLUMNS = [UsageLogField.RequestBody, UsageLogField.ResponseBody, UsageLogField.AssembledResponse];

const flatPredicates = (query: StructuredQuery): QueryPredicate[] =>
  groupArgs(query.filter).flatMap((node) => (String(node.op) === QueryLogicalOperator.And ? groupArgs(node) : [node]));

const predicateFor = (query: StructuredQuery, name: string): QueryPredicate | undefined =>
  flatPredicates(query).find((node) => fieldName(node) === name);

// The time bound is two predicates over one field, so `predicateFor` would only ever see the lower one.
const timePredicates = (query: StructuredQuery): QueryPredicate[] =>
  flatPredicates(query).filter((node) => fieldName(node) === UsageLogField.RequestTime);

describe('buildConversationEntryHopsQuery', () => {
  const query = buildConversationEntryHopsQuery(CHAT_ID, 200);

  test('reads the hop log in row mode, ordered by when each turn started', () => {
    expect(query.entity).toBe(USAGE_LOG_ENTITY);
    expect(query.mode).toBe(QueryMode.Row);
    expect(query.sort).toEqual([{ field: UsageLogField.RequestTime, dir: QuerySortDirection.Asc }]);
  });

  // A root hop's parent is null and never '', so an empty-string comparison would match nothing and read as
  // a conversation with no turns.
  test('selects entry hops by a null parent span, not an empty string', () => {
    const parent = predicateFor(query, UsageLogField.CoreParentSpanId);

    expect(parent?.op).toBe(QueryOperator.Eq);
    expect((parent?.args?.[1] as QueryValueExpr).value_type).toBe(QueryValueType.Null);
    expect((parent?.args?.[1] as QueryValueExpr).value).toBeNull();
  });

  test('filters by the conversation', () => {
    expect((predicateFor(query, UsageLogField.ChatId)?.args?.[1] as QueryValueExpr).value).toBe(CHAT_ID.id);
  });

  // The whole point of the cheap read: it establishes the turns without paying for a body.
  test('names no body column', () => {
    const names = selectNames(query);

    BODY_COLUMNS.forEach((column) => expect(names).not.toContain(column));
  });

  test('names what the assembly and the disclosure need', () => {
    expect(selectNames(query)).toEqual([
      UsageLogField.TraceId,
      UsageLogField.RequestTime,
      UsageLogField.Deployment,
      UsageLogField.NumberRequestMessages,
      UsageLogField.RequestBodyBytes,
      UsageLogField.ResponseBodyBytes,
    ]);
  });

  test('requests the total so a clipped read can disclose its bound', () => {
    expect((query.page as QueryOffsetPage).include_total).toBe(true);
    expect((query.page as QueryOffsetPage).limit).toBe(200);
  });
});

describe('buildConversationHopCountQuery', () => {
  const query = buildConversationHopCountQuery(CHAT_ID);

  test('counts the conversation hops with no entry-hop predicate', () => {
    expect(query.entity).toBe(USAGE_LOG_ENTITY);
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(fieldName(query.filter as QueryPredicate)).toBe(UsageLogField.ChatId);
    expect(JSON.stringify(query.filter)).not.toContain(UsageLogField.CoreParentSpanId);
  });

  test('names only the count, so it stays cheap enough to run beside the entry-hop read', () => {
    const [column] = query.select as QueryOutputColumn[];

    expect((column.expr as QueryFnExpr).name).toBe('count');
    expect(column.as).toBe(CONVERSATION_HOP_COUNT_ALIAS);
    BODY_COLUMNS.forEach((name) => expect(JSON.stringify(query.select)).not.toContain(name));
  });
});

describe('buildConversationEntryBodiesQuery', () => {
  const withAssembled = buildConversationEntryBodiesQuery(CHAT_ID, HOPS, [...BODY_COLUMNS, UsageLogField.TraceId]);

  test('narrows to the traces whose bodies the assembly needs', () => {
    const traces = predicateFor(withAssembled, UsageLogField.TraceId);

    expect(traces?.op).toBe(QueryOperator.In);
    expect(JSON.stringify(traces?.args?.[1])).toContain('t1');
    expect(JSON.stringify(traces?.args?.[1])).toContain('t2');
  });

  test('still filters by the conversation and the null parent span', () => {
    expect((predicateFor(withAssembled, UsageLogField.ChatId)?.args?.[1] as QueryValueExpr).value).toBe(CHAT_ID.id);
    expect(predicateFor(withAssembled, UsageLogField.CoreParentSpanId)).toBeTruthy();
  });

  // The table partitions on the day of `request_time`, so the chat predicate prunes nothing and the read is
  // rejected at the query budget. The bound has to be a range: `in` compiles to `has([...], request_time)`,
  // a function over the column that prunes nothing — measured at 47 GiB read against 1.46 GiB for the
  // equivalent range. The window is the fetched rows' own instants, not the conversation's span, which runs
  // for weeks.
  test('bounds the read by a range over the recorded times of the rows it fetches', () => {
    const times = timePredicates(withAssembled);

    expect(times.map(({ op }) => op)).toEqual([QueryOperator.Ge, QueryOperator.Le]);
    times.forEach((time) => expect((time.args?.[1] as QueryValueExpr).value_type).toBe(QueryValueType.Timestamp));
    expect(times.map((time) => (time.args?.[1] as QueryValueExpr).value)).toEqual(['1787218895000', '1787220824000']);
  });

  // The DSL takes a timestamp only as epoch millis while rows carry ISO-8601, so passing a returned value
  // through verbatim is rejected outright and takes every body read with it.
  test('converts an ISO-8601 recorded time to epoch millis', () => {
    const query = buildConversationEntryBodiesQuery(
      CHAT_ID,
      [hopRow('t1', '2026-08-18T11:33:17.216Z'), hopRow('t2', '2026-08-18T11:40:00.000Z')],
      BODY_COLUMNS,
    );

    expect(timePredicates(query).map((time) => (time.args?.[1] as QueryValueExpr).value)).toEqual([
      '1787052797216',
      '1787053200000',
    ]);
  });

  // A single-row read still needs the predicate: one instant is one partition, and without it the read is
  // unbounded across the whole table.
  test('bounds a single hop to its own instant', () => {
    const query = buildConversationEntryBodiesQuery(CHAT_ID, [HOPS[1]], BODY_COLUMNS);

    expect(timePredicates(query).map((time) => (time.args?.[1] as QueryValueExpr).value)).toEqual([
      '1787220824000',
      '1787220824000',
    ]);
  });

  test('bounds nothing when no hop records a time, rather than sending an unparseable literal', () => {
    const query = buildConversationEntryBodiesQuery(CHAT_ID, [hopRow('t1', null)], BODY_COLUMNS);

    expect(timePredicates(query)).toHaveLength(0);
  });

  test('names the assembled column where the schema reports it', () => {
    expect(selectNames(withAssembled)).toContain(UsageLogField.AssembledResponse);
  });

  // The gate that protects a full administrator: an instance predating the column does not persist it, and
  // the service rejects the whole query for one unknown field.
  test('omits the assembled column where the schema does not report it', () => {
    const names = selectNames(
      buildConversationEntryBodiesQuery(CHAT_ID, HOPS, [
        UsageLogField.TraceId,
        UsageLogField.RequestBody,
        UsageLogField.ResponseBody,
      ]),
    );

    expect(names).not.toContain(UsageLogField.AssembledResponse);
    expect(names).toContain(UsageLogField.RequestBody);
    expect(names).toContain(UsageLogField.ResponseBody);
  });

  test('omits the assembled column when the schema could not be read', () => {
    expect(selectNames(buildConversationEntryBodiesQuery(CHAT_ID, HOPS))).not.toContain(
      UsageLogField.AssembledResponse,
    );
  });

  // The read gate accepts either response column, so an instance persisting only the assembled one is a
  // supported state. Naming `response_body` regardless rejected the whole query and broke the Chat view.
  test('omits the raw response column where the schema reports only the assembled one', () => {
    const names = selectNames(
      buildConversationEntryBodiesQuery(CHAT_ID, HOPS, [
        UsageLogField.TraceId,
        UsageLogField.RequestBody,
        UsageLogField.AssembledResponse,
      ]),
    );

    expect(names).not.toContain(UsageLogField.ResponseBody);
    expect(names).toContain(UsageLogField.AssembledResponse);
    expect(names).toContain(UsageLogField.RequestBody);
  });
});

describe('buildConversationHopBodyQuery', () => {
  const query = buildConversationHopBodyQuery(CHAT_ID, 'tr1', 'sp1', '2026-08-18T11:33:17.216Z', BODY_COLUMNS);

  // One hop at a time, never in bulk: a measured 384-hop turn carried 99.26 MiB of request bodies, one hop of
  // it reaching 4.00 MiB.
  test('narrows to exactly one hop', () => {
    expect((predicateFor(query, UsageLogField.ChatId)?.args?.[1] as QueryValueExpr).value).toBe(CHAT_ID.id);
    expect((predicateFor(query, UsageLogField.TraceId)?.args?.[1] as QueryValueExpr).value).toBe('tr1');
    expect((predicateFor(query, UsageLogField.CoreSpanId)?.args?.[1] as QueryValueExpr).value).toBe('sp1');
    expect((query.page as QueryOffsetPage).limit).toBe(1);
  });

  // The same pruning rule as the transcript read: the table partitions on the day of `request_time`, and one
  // hop is one instant, so the range collapses to a single partition.
  test('bounds the read by the hop own instant, as a range in epoch millis', () => {
    const times = timePredicates(query);

    expect(times.map(({ op }) => op)).toEqual([QueryOperator.Ge, QueryOperator.Le]);
    expect(times.map((time) => (time.args?.[1] as QueryValueExpr).value)).toEqual(['1787052797216', '1787052797216']);
  });

  test('bounds nothing when the hop records no time, rather than sending an unparseable literal', () => {
    expect(timePredicates(buildConversationHopBodyQuery(CHAT_ID, 'tr1', 'sp1', null, BODY_COLUMNS))).toHaveLength(0);
  });

  test('names the assembled column only where the schema reports it', () => {
    expect(selectNames(query)).toContain(UsageLogField.AssembledResponse);
    expect(
      selectNames(
        buildConversationHopBodyQuery(CHAT_ID, 'tr1', 'sp1', 1, [
          UsageLogField.RequestBody,
          UsageLogField.ResponseBody,
        ]),
      ),
    ).not.toContain(UsageLogField.AssembledResponse);
  });

  // The event kind is what splits the request-side decoding, so it has to come back with the bodies.
  test('names the bodies and the event kind that decides how to read them', () => {
    const names = selectNames(query);

    expect(names).toContain(UsageLogField.RequestBody);
    expect(names).toContain(UsageLogField.ResponseBody);
    expect(names).toContain(UsageLogField.EventKind);
  });
});

// A read predicated on an attribute instead of a conversation took the service down, so the chat predicate is
// not an optimisation — it is the contract every hop-log query in this view keeps.
describe('every transcript query filters by the conversation', () => {
  test.each([
    ['entry hops', buildConversationEntryHopsQuery(CHAT_ID, 10)],
    ['hop count', buildConversationHopCountQuery(CHAT_ID)],
    ['entry bodies', buildConversationEntryBodiesQuery(CHAT_ID, HOPS, BODY_COLUMNS)],
    ['hop body', buildConversationHopBodyQuery(CHAT_ID, 'tr1', 'sp1', 1, BODY_COLUMNS)],
  ])('%s', (_name, query) => {
    expect(JSON.stringify(query.filter)).toContain(UsageLogField.ChatId);
    expect(JSON.stringify(query.filter)).toContain(CHAT_ID.id);
  });
});

// The other half of that contract. `chat_id` is bloom-filtered and the enrichment column is not, so the
// column is chosen per session rather than unified: a chat session must keep the index, and an agent
// session — whose hops carry no chat id at all — must not be scoped by a column that is always empty for it.
describe("a hop-log query is scoped by the column that session's hops carry", () => {
  const agentQueries: [string, StructuredQuery][] = [
    ['entry hops', buildConversationEntryHopsQuery(AGENT_SCOPE, 10)],
    ['hop count', buildConversationHopCountQuery(AGENT_SCOPE)],
    ['entry bodies', buildConversationEntryBodiesQuery(AGENT_SCOPE, HOPS, BODY_COLUMNS)],
    ['hop body', buildConversationHopBodyQuery(AGENT_SCOPE, 'tr1', 'sp1', 1, BODY_COLUMNS)],
  ];

  test.each(agentQueries)('%s names the identity enrichment for an agent session', (_name, query) => {
    expect(JSON.stringify(query.filter)).toContain(UsageLogField.ClientSessionId);
    expect(JSON.stringify(query.filter)).toContain(AGENT_SCOPE.id);
  });

  test('an agent session is never scoped by the empty chat id', () => {
    agentQueries.forEach(([, query]) => {
      expect(predicateFor(query, UsageLogField.ChatId)).toBeUndefined();
    });
  });

  test('a session whose source is unknown takes the enrichment column, not the index', () => {
    const query = buildConversationHopCountQuery({ id: 'unknown-1' });

    expect(JSON.stringify(query.filter)).toContain(UsageLogField.ClientSessionId);
  });
});
