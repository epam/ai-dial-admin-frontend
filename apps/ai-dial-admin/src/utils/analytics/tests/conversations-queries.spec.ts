import { describe, expect, test } from 'vitest';

import {
  CONVERSATION_PAGE_SIZE,
  CONVERSATION_SUMMARY_ENRICHMENT,
  FEEDBACK_CANDIDATE_LIMIT,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationField,
  FeedbackField,
  FeedbackFilter,
  RateAnalyticsField,
  RatingDirection,
  UsageLogField,
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
  buildRatedConversationIdsQuery,
} from '@/src/utils/analytics/conversations-queries';

const RANGE: TimeRange = {
  startDate: new Date('2026-07-21T00:00:00.000Z'),
  endDate: new Date('2026-07-28T00:00:00.000Z'),
};

const START_MS = '1784592000000';
const END_MS = '1785196800000';

const groupArgs = (filter: unknown): QueryPredicate[] => (filter as QueryGroup).args as QueryPredicate[];

const fieldName = (node: QueryPredicate): string | undefined => (node.args?.[0] as QueryFieldExpr)?.name;

describe('buildConversationListQuery :: shape', () => {
  const build = () => buildConversationListQuery({ range: RANGE });

  const aliased = (alias: string): QueryOutputColumn | undefined => build().select?.find((entry) => entry.as === alias);

  test('is an aggregate query over dial_usage_log grouped by chat_id', () => {
    const query = build();

    expect(query.entity).toBe('dial_usage_log');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual([UsageLogField.ChatId]);
  });

  test('projects the grouped chat_id as a plain unaliased column', () => {
    const grouped = build().select?.find((entry) => entry.expr.type === QueryExprType.Field);

    expect(grouped?.expr).toEqual({ type: QueryExprType.Field, name: UsageLogField.ChatId });
    expect(grouped?.as).toBeUndefined();
  });

  test.each([
    [ConversationField.Turns, 'count', UsageLogField.TraceId],
    [ConversationField.Tokens, 'sum', UsageLogField.TotalTokens],
    [ConversationField.Cost, 'sum', UsageLogField.TotalPrice],
    [ConversationField.LastActivity, 'max', UsageLogField.RequestTime],
    [ConversationField.FirstActivity, 'min', UsageLogField.RequestTime],
    // deployment is not in group_by, so it needs an aggregate; a conversation spanning models is reported by count.
    [ConversationField.Model, 'min', UsageLogField.Deployment],
    [ConversationField.ModelCount, 'count', UsageLogField.Deployment],
    [ConversationField.Project, 'min', UsageLogField.ProjectId],
  ])('%s aggregates %s over %s', (alias, fnName, sourceField) => {
    const expr = aliased(alias)?.expr as QueryFnExpr;

    expect(expr.name).toBe(fnName);
    expect(expr.args).toEqual([{ type: QueryExprType.Field, name: sourceField }]);
  });

  test('carries exactly the aliases the grid displays, in order', () => {
    const aliases = build()
      .select?.map((entry) => entry.as)
      .filter(Boolean);

    expect(aliases).toEqual([
      ConversationField.Turns,
      ConversationField.Tokens,
      ConversationField.Cost,
      ConversationField.LastActivity,
      ConversationField.FirstActivity,
      ConversationField.Model,
      ConversationField.ModelCount,
      ConversationField.Project,
    ]);
  });

  // One turn can span several hop rows, and one conversation several deployments.
  test('only the counting aggregates set distinct', () => {
    const distinctAliases = build()
      .select?.filter((entry) => (entry.expr as QueryFnExpr).distinct)
      .map((entry) => entry.as);

    expect(distinctAliases).toEqual([ConversationField.Turns, ConversationField.ModelCount]);
  });

  test('no alias collides with a source column inside its own expression', () => {
    build().select?.forEach((entry) => {
      if (!entry.as) return;
      const argNames = ((entry.expr as QueryFnExpr).args ?? []).map((arg) =>
        arg.type === QueryExprType.Field ? arg.name : null,
      );
      expect(argNames).not.toContain(entry.as);
    });
  });
});

describe('buildConversationListQuery :: filter', () => {
  const filterArgs = () => groupArgs(buildConversationListQuery({ range: RANGE }).filter);

  const findPredicate = (op: QueryOperator, name: string): QueryPredicate | undefined =>
    filterArgs().find((node) => node.op === op && fieldName(node) === name);

  test('bounds request_time with epoch-millisecond timestamp literals, not ISO strings', () => {
    const lower = findPredicate(QueryOperator.Ge, UsageLogField.RequestTime);
    const upper = findPredicate(QueryOperator.Le, UsageLogField.RequestTime);

    expect(lower?.args[1]).toMatchObject({ value_type: QueryValueType.Timestamp, value: START_MS });
    expect(upper?.args[1]).toMatchObject({ value_type: QueryValueType.Timestamp, value: END_MS });
  });

  // The column is non-nullable and defaults to '', so `eq null` would match nothing — hence a string compare
  // and no null literal anywhere in the filter.
  test('excludes empty conversation ids by string comparison rather than against null', () => {
    expect(findPredicate(QueryOperator.Ne, UsageLogField.ChatId)?.args[1]).toEqual({
      type: QueryExprType.Value,
      value_type: QueryValueType.String,
      value: '',
    });
    expect(
      filterArgs().filter((node) =>
        (node.args ?? []).some((arg) => arg.type === QueryExprType.Value && arg.value_type === QueryValueType.Null),
      ),
    ).toEqual([]);
  });

  test('the filter is a single flat AND group of three predicates', () => {
    expect((buildConversationListQuery({ range: RANGE }).filter as QueryGroup).op).toBe(QueryLogicalOperator.And);
    expect(filterArgs()).toHaveLength(3);
  });
});

describe('buildConversationListQuery :: search', () => {
  const searchFilterArgs = (search: string) => groupArgs(buildConversationListQuery({ range: RANGE, search }).filter);

  const searchGroup = (search: string): QueryGroup | undefined =>
    (searchFilterArgs(search) as unknown as QueryGroup[]).find((node) => node.op === QueryLogicalOperator.Or);

  const searchFields = (search: string): (string | undefined)[] =>
    (searchGroup(search)?.args as QueryPredicate[]).map(fieldName);

  test.each(['', '   ', '\t\n'])('a blank term (%j) adds no predicate rather than matching everything', (term) => {
    expect(searchFilterArgs(term)).toHaveLength(3);
    expect(searchGroup(term)).toBeUndefined();
  });

  test('a term adds one OR group of case-insensitive contains alongside the existing predicates', () => {
    expect(searchFilterArgs('acme')).toHaveLength(4);
    expect(searchGroup('acme')?.args).toEqual([
      {
        op: QueryOperator.Ico,
        args: [
          { type: QueryExprType.Field, name: UsageLogField.ChatId },
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'acme' },
        ],
      },
      {
        op: QueryOperator.Ico,
        args: [
          { type: QueryExprType.Field, name: UsageLogField.ProjectId },
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'acme' },
        ],
      },
    ]);
  });

  // Select aliases are absent from the field bindings a filter resolves against, so matching `project`
  // would be an unknown-field 400.
  test('matches the base project_id column, never the project alias', () => {
    expect(searchFields('acme')).not.toContain(ConversationField.Project);
    expect(searchFields('acme')).toContain(UsageLogField.ProjectId);
  });

  test('trims the term rather than searching for the whitespace', () => {
    expect(searchGroup('  acme  ')).toEqual(searchGroup('acme'));
  });

  // The translator supplies the %…% and escapes \ % _ server-side; wrapping here would double-escape.
  test.each(['%', '_', 'a%b', '50%_off'])('passes %s through unescaped and unwrapped', (term) => {
    const values = (searchGroup(term)?.args as QueryPredicate[]).map((node) => (node.args[1] as QueryValueExpr).value);

    expect(values).toEqual([term, term]);
  });

  // The enrichment is not registered, so its columns cannot be referenced — an unknown field is a 400. One flag
  // turns on both selecting and searching them, so a title can never be displayed without being searchable.
  test('neither selects nor searches the enrichment columns while the enrichment is unavailable', () => {
    const query = buildConversationListQuery({ range: RANGE, search: 'acme' });

    expect(searchFields('acme')).toEqual([UsageLogField.ChatId, UsageLogField.ProjectId]);
    expect(query.select?.some((entry) => entry.as === ConversationField.Title)).toBe(false);
    expect(JSON.stringify(query)).not.toContain(CONVERSATION_SUMMARY_ENRICHMENT);
  });

  test('search never lands in having, which would forfeit partition pruning', () => {
    expect(buildConversationListQuery({ range: RANGE, search: 'acme' }).having).toBeUndefined();
  });

  test('search does not disturb the other predicates, the select, the sort or the page', () => {
    const withSearch = buildConversationListQuery({ range: RANGE, search: 'acme' });
    const withoutSearch = buildConversationListQuery({ range: RANGE });

    expect(withSearch.sort).toEqual(withoutSearch.sort);
    expect(withSearch.page).toEqual(withoutSearch.page);
    expect(withSearch.select).toEqual(withoutSearch.select);
    expect(groupArgs(withSearch.filter).slice(0, 3)).toEqual(groupArgs(withoutSearch.filter));
  });
});

describe('buildConversationListQuery :: feedback narrowing by chat id', () => {
  const withIds = (chatIds: string[]) => buildConversationListQuery({ range: RANGE, chatIds });

  const inPredicate = (chatIds: string[]): QueryPredicate | undefined =>
    groupArgs(withIds(chatIds).filter).find((node) => node.op === QueryOperator.In);

  test('restricts chat_id to the supplied candidate ids', () => {
    const predicate = inPredicate(['a', 'b']);

    expect(fieldName(predicate as QueryPredicate)).toBe(UsageLogField.ChatId);
    expect(predicate?.args[1]).toEqual({
      type: QueryExprType.Array,
      items: [
        { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'a' },
        { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'b' },
      ],
    });
  });

  // An empty `in` list is a 400, so the caller short-circuits instead — the builder must not emit one.
  test('adds no predicate for an empty candidate list', () => {
    expect(inPredicate([])).toBeUndefined();
    expect(groupArgs(withIds([]).filter)).toHaveLength(3);
  });

  test('composes with search rather than replacing it', () => {
    const args = groupArgs(buildConversationListQuery({ range: RANGE, search: 'acme', chatIds: ['a'] }).filter);

    expect(args).toHaveLength(5);
    expect(args.some((node) => node.op === QueryOperator.In)).toBe(true);
    expect((args as unknown as QueryGroup[]).some((node) => node.op === QueryLogicalOperator.Or)).toBe(true);
  });

  test('narrowing does not raise the page limit, so a filtered result is still one page', () => {
    const many = Array.from({ length: 500 }, (_, i) => `chat-${i}`);

    expect((withIds(many).page as QueryOffsetPage).limit).toBe(CONVERSATION_PAGE_SIZE);
  });
});

describe('buildConversationListQuery :: sort, page and purity', () => {
  const build = () => buildConversationListQuery({ range: RANGE });

  // Without the chat_id tiebreaker the fixed page is not stable between requests, since the service
  // appends no ordering of its own.
  test('orders by last activity descending, ending with a chat_id ascending tiebreaker', () => {
    expect(build().sort).toEqual([
      { field: ConversationField.LastActivity, dir: QuerySortDirection.Desc },
      { field: UsageLogField.ChatId, dir: QuerySortDirection.Asc },
    ]);
  });

  // A limit above 1000 is a hard 400, and include_total is always null in aggregate mode.
  test('requests a single fixed page of 20 by offset and no total', () => {
    expect(build().page).toEqual({ type: 'offset', offset: 0, limit: CONVERSATION_PAGE_SIZE, include_total: false });
    expect(CONVERSATION_PAGE_SIZE).toBeLessThanOrEqual(1000);
  });

  test('is a pure function of the range, reading no clock', () => {
    expect(build()).toEqual(build());
  });

  test('a different range changes only the time bounds', () => {
    const shifted = buildConversationListQuery({
      range: { startDate: new Date('2026-06-01T00:00:00.000Z'), endDate: new Date('2026-06-08T00:00:00.000Z') },
    });

    expect(shifted.select).toEqual(build().select);
    expect(shifted.sort).toEqual(build().sort);
    expect(shifted.filter).not.toEqual(build().filter);
  });

  test('selects no sensitive column', () => {
    const serialized = JSON.stringify(build());

    ['request_body', 'response_body', 'jwt_claims', 'request_tags'].forEach((column) => {
      expect(serialized).not.toContain(column);
    });
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
