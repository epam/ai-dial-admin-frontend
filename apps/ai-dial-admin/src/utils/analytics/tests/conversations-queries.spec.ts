import { describe, expect, test } from 'vitest';

import { FEEDBACK_CANDIDATE_LIMIT } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationTotalsField,
  ConversationsField,
  FeedbackField,
  FeedbackFilter,
  RateAnalyticsField,
  RatingDirection,
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
  QueryValueExpr,
  QueryValueType,
} from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import {
  buildConversationListQuery,
  buildConversationRatingsQuery,
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

describe('buildConversationListQuery :: shape', () => {
  test('reads the materialized conversations entity in row mode', () => {
    const query = buildList();

    expect(query.entity).toBe('conversations');
    expect(query.mode).toBe(QueryMode.Row);
  });

  // The rollup is stored, so nothing is recomputed per request.
  test('never groups and never aggregates', () => {
    const query = buildList();

    expect(query.group_by).toBeUndefined();
    expect(query.having).toBeUndefined();
    expect(JSON.stringify(query.select)).not.toContain(QueryExprType.Fn);
  });

  test('selects exactly the fields the grid renders, by their entity names', () => {
    const names = (buildList().select as QueryOutputColumn[]).map((column) => (column.expr as QueryFieldExpr).name);

    expect(names).toEqual([
      ConversationsField.ChatId,
      ConversationsField.ProjectId,
      ConversationsField.TurnCount,
      ConversationsField.TotalTokens,
      ConversationsField.TotalPrice,
      ConversationsField.LastRequestTime,
      ConversationsField.FirstRequestTime,
    ]);
  });

  test('aliases nothing — a stored column needs no rename', () => {
    (buildList().select as QueryOutputColumn[]).forEach((column) => expect(column.as).toBeUndefined());
  });

  // dial_usage_log columns belong to a different entity and would be rejected as unknown fields.
  test('references no column of the usage log or of an enrichment', () => {
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
  test('orders by last activity with a stable id tiebreaker last', () => {
    const sort = buildList().sort;

    expect(sort).toEqual([
      { field: ConversationsField.LastRequestTime, dir: QuerySortDirection.Desc },
      { field: ConversationsField.ChatId, dir: QuerySortDirection.Asc },
    ]);
    expect(sort?.at(-1)?.field).toBe(ConversationsField.ChatId);
  });

  // Row mode is the only mode the service populates a total for, and paging needs one.
  test('requests the total and carries the caller offset and limit', () => {
    expect(buildList().page).toEqual({ type: 'offset', offset: 0, limit: 100, include_total: true });
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
  const buildTotals = (overrides: Partial<Parameters<typeof buildConversationTotalsQuery>[0]> = {}) =>
    buildConversationTotalsQuery({ range: RANGE, ...overrides });

  test('counts conversations and sums cost over the whole result', () => {
    const query = buildTotals();

    expect(query.entity).toBe('conversations');
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

  // The pills must never disagree with the rows beneath them, which only holds while both filters match.
  test.each([
    ['no filters', {}],
    ['a search term', { search: 'acme' }],
    ['feedback narrowing', { chatIds: ['a', 'b'] }],
    ['both', { search: 'acme', chatIds: ['a'] }],
  ])('carries a filter identical to the list query for %s', (_label, overrides) => {
    expect(buildTotals(overrides).filter).toEqual(buildList(overrides).filter);
  });
});

describe('buildRatedConversationIdsQuery', () => {
  const build = (feedback: FeedbackFilter) => buildRatedConversationIdsQuery({ range: RANGE, feedback });

  const filterArgs = (feedback: FeedbackFilter) => groupArgs(build(feedback).filter);

  const ratePredicate = (feedback: FeedbackFilter): QueryPredicate | undefined =>
    filterArgs(feedback).find((node) => fieldName(node) === RateAnalyticsField.Rate);

  const RATED_STATES = [FeedbackFilter.Positive, FeedbackFilter.Negative, FeedbackFilter.Rated];

  test.each(RATED_STATES)('%s targets rate_analytics grouped by chat_id', (feedback) => {
    const query = build(feedback);

    expect(query.entity).toBe('rate_analytics');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual([RateAnalyticsField.ChatId]);
  });

  test('selects the conversation id and its most recent rating time', () => {
    const query = build(FeedbackFilter.Rated);

    expect(query.select?.[0]).toEqual({ expr: { type: QueryExprType.Field, name: RateAnalyticsField.ChatId } });
    expect(query.select?.[1].as).toBe(FeedbackField.LastRated);
  });

  // rate_analytics.comment is sensitive, and the remaining columns are not in this entity's schema.
  test.each(RATED_STATES)('%s references no unqueryable column', (feedback) => {
    const serialized = JSON.stringify(build(feedback));

    ['comment', 'trace_id', 'core_span_id', '_ingested_at'].forEach((column) => {
      expect(serialized).not.toContain(column);
    });
  });

  // A DIAL thumb normalizes to 1/0, so the two directions must split on a strict/non-strict pair to keep
  // a zero thumb out of positive and inside negative.
  test.each([
    [FeedbackFilter.Positive, QueryOperator.Gt, QueryValueType.Integer, '0'],
    [FeedbackFilter.Negative, QueryOperator.Le, QueryValueType.Integer, '0'],
    // ne is the only operator that accepts a null literal.
    [FeedbackFilter.Rated, QueryOperator.Ne, QueryValueType.Null, null],
  ])('%s filters rate with %s', (feedback, op, valueType, value) => {
    expect(ratePredicate(feedback)).toEqual({
      op,
      args: [
        { type: QueryExprType.Field, name: RateAnalyticsField.Rate },
        { type: QueryExprType.Value, value_type: valueType, value },
      ],
    });
  });

  test.each(RATED_STATES)('%s bounds request_time, guards empty ids and stays a flat AND of four', (feedback) => {
    const args = filterArgs(feedback);
    const bounds = args.filter(
      (node) =>
        [QueryOperator.Ge, QueryOperator.Le].includes(node.op) && fieldName(node) === RateAnalyticsField.RequestTime,
    );
    const guard = args.find((node) => node.op === QueryOperator.Ne && fieldName(node) === RateAnalyticsField.ChatId);

    expect(bounds.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual([START_MS, END_MS]);
    expect((guard?.args[1] as QueryValueExpr).value).toBe('');
    expect((build(feedback).filter as QueryGroup).op).toBe(QueryLogicalOperator.And);
    expect(args).toHaveLength(4);
  });

  test('All adds no rate predicate', () => {
    expect(ratePredicate(FeedbackFilter.All)).toBeUndefined();
    expect(filterArgs(FeedbackFilter.All)).toHaveLength(3);
  });

  // The candidate set is capped, so ordering by most recent rating keeps the rows the page is likeliest to show.
  test('orders by most recent rating with a stable tiebreaker, capped at the service maximum', () => {
    const query = build(FeedbackFilter.Rated);

    expect(query.sort).toEqual([
      { field: FeedbackField.LastRated, dir: QuerySortDirection.Desc },
      { field: RateAnalyticsField.ChatId, dir: QuerySortDirection.Asc },
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
  const build = (direction: RatingDirection, chatIds = ['a', 'b']) =>
    buildConversationRatingsQuery({ range: RANGE, chatIds, direction });

  const ratePredicate = (direction: RatingDirection): QueryPredicate | undefined =>
    groupArgs(build(direction).filter).find((node) => fieldName(node) === RateAnalyticsField.Rate);

  test('counts rate per conversation, restricted to the ids given', () => {
    const query = build(RatingDirection.Up);

    expect(query.entity).toBe('rate_analytics');
    expect(query.group_by).toEqual([RateAnalyticsField.ChatId]);
    expect(query.select).toEqual([
      { expr: { type: QueryExprType.Field, name: RateAnalyticsField.ChatId } },
      {
        expr: { type: QueryExprType.Fn, name: 'count', args: [{ type: QueryExprType.Field, name: 'rate' }] },
        as: FeedbackField.RatingCount,
      },
    ]);
    expect(groupArgs(query.filter).find((node) => node.op === QueryOperator.In)?.args[1]).toMatchObject({
      type: QueryExprType.Array,
    });
  });

  // `rate` is signed — DIAL sends 1 for a like and -1 for a dislike, and a normalized boolean false is 0 —
  // so the split cannot come from count and sum. Each direction reuses the feedback filter's own predicate,
  // which is what guarantees a conversation the Positive filter selects shows a non-zero up count.
  test.each([
    [RatingDirection.Up, QueryOperator.Gt],
    [RatingDirection.Down, QueryOperator.Le],
  ])('%s counts under the same predicate the feedback filter uses (%s)', (direction, op) => {
    expect(ratePredicate(direction)).toEqual({
      op,
      args: [
        { type: QueryExprType.Field, name: RateAnalyticsField.Rate },
        { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '0' },
      ],
    });
  });

  test('the two directions differ only by the rate predicate', () => {
    const up = build(RatingDirection.Up);
    const down = build(RatingDirection.Down);

    expect(up.select).toEqual(down.select);
    expect(up.page).toEqual(down.page);
    expect(groupArgs(up.filter).slice(0, 3)).toEqual(groupArgs(down.filter).slice(0, 3));
    expect(up.filter).not.toEqual(down.filter);
  });

  // Restricted to the page's ids, so the limit tracks that count — a cap below it would silently report a
  // displayed conversation as unrated.
  test('pages for exactly the ids requested, never zero', () => {
    expect((build(RatingDirection.Up, ['a', 'b', 'c']).page as QueryOffsetPage).limit).toBe(3);
    expect((build(RatingDirection.Up, []).page as QueryOffsetPage).limit).toBe(1);
  });
});
