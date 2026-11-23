import { describe, expect, test } from 'vitest';

import {
  ARRAY_VALUE_PAGE_SIZE,
  SESSION_ARRAY_VALUE_SOURCE,
  SESSION_FIELD_VALUE_COUNT_ALIAS,
  SESSION_FIELD_VALUE_LIMIT,
  SESSION_RATING_SELECT_FIELDS,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/sessions-trace';
import {
  SessionArrayFilter,
  SessionColumnFilter,
  SessionFilterOperator,
  SessionRatingTotalsField,
  SessionScalarOperator,
  SessionTotalsField,
  SessionsField,
  FeedbackFilter,
  ResponseRatingsField,
  UsageLogField,
} from '@/src/models/analytics/sessions-trace';
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
import { SessionsSource } from '@/src/models/analytics/sessions-source';
import { TimeRange } from '@/src/models/time-range';
import {
  buildArrayValueResolutionQuery,
  buildSessionFieldValuesQuery,
  buildSessionHopBodyQuery,
  buildSessionListQuery,
  buildSessionRatedResponsesQuery,
  buildSessionRatingTotalsQuery,
  buildSessionTotalsQuery,
  buildSessionTracePageQuery,
} from '@/src/utils/analytics/sessions-queries';
import { defaultSessionsSource } from '@/src/utils/analytics/sessions-source';

const RANGE: TimeRange = {
  startDate: new Date('2026-07-21T00:00:00.000Z'),
  endDate: new Date('2026-07-28T00:00:00.000Z'),
};

const START_MS = '1784592000000';
const END_MS = '1785196800000';

const PAGE = { offset: 0, limit: 100 };

const RATING_NAMESPACE = 'response_ratings';

const RATED_SOURCE: SessionsSource = {
  ...defaultSessionsSource(),
  enrichments: ['session_insights', RATING_NAMESPACE],
  ratingEnrichment: RATING_NAMESPACE,
};

const CUSTOM_SOURCE: SessionsSource = {
  baseTable: 'agent_runs',
  sessionId: 'run_key',
  time: 'ended_at',
  project: null,
  title: null,
  cost: null,
  turns: 'steps',
  enrichments: ['custom_ratings'],
  ratingEnrichment: 'custom_ratings',
};

const DEFAULT_ROLE_FIELDS = [
  SessionsField.ChatId,
  SessionsField.LastRequestTime,
  SessionsField.ProjectId,
  SessionsField.TotalPrice,
  SessionsField.TurnCount,
];

const groupArgs = (filter: unknown): QueryPredicate[] => (filter as QueryGroup).args as QueryPredicate[];

const fieldName = (node: QueryPredicate): string | undefined => (node.args?.[0] as QueryFieldExpr)?.name;

const buildList = (overrides: Partial<Parameters<typeof buildSessionListQuery>[0]> = {}) =>
  buildSessionListQuery({ range: RANGE, ...PAGE, ...overrides });

const selectNames = (query: StructuredQuery): string[] =>
  (query.select as QueryOutputColumn[]).map((column) => (column.expr as QueryFieldExpr).name);

describe('buildSessionListQuery :: shape', () => {
  test('reads the materialized sessions entity in row mode', () => {
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

  test('names only the role-bound fields unconditionally once the caller has classified fields', () => {
    const names = selectNames(buildList({ sourceFields: ['project_id', 'success_count'] }));

    expect(names).toEqual([...DEFAULT_ROLE_FIELDS, 'success_count']);
    expect(names).not.toContain(SessionsField.UserHash);
    expect(names).not.toContain(SessionsField.Deployments);
  });

  test('does not name row identity twice when the caller also classifies it', () => {
    const names = selectNames(buildList({ sourceFields: [SessionsField.ChatId, 'total_price'] }));

    expect(names.filter((name) => name === SessionsField.ChatId)).toHaveLength(1);
  });

  // Without a schema there are no buckets to classify from, and the curated columns still render — so the
  // base rollup columns are named rather than left to show empty cells.
  test('selects exactly the fields the grid renders, by their entity names', () => {
    const names = selectNames(buildList());

    expect(names).toEqual([
      ...DEFAULT_ROLE_FIELDS,
      SessionsField.UserHash,
      SessionsField.TotalTokens,
      SessionsField.FirstRequestTime,
      SessionsField.Deployments,
    ]);
  });

  test('names the title by its qualified flat name once the schema confirms the Title role', () => {
    const names = selectNames(buildList({ source: { ...defaultSessionsSource(), title: SessionsField.InsightTitle } }));

    expect(names).toContain('session_insights.title');
  });

  test('leaves the title out when the schemaless default drops the enrichment-bound Title role', () => {
    expect(selectNames(buildList())).not.toContain(SessionsField.InsightTitle);
  });

  test('leaves the hidden curated enrichment columns out of the default projection', () => {
    const names = selectNames(buildList());

    for (const hidden of [SessionsField.InsightSentiment, SessionsField.InsightTopic, SessionsField.Traces]) {
      expect(names).not.toContain(hidden);
    }
  });

  test('projects a curated enrichment column once it is visible', () => {
    const names = selectNames(buildList({ visibleEnrichmentFields: [SessionsField.InsightSentiment] }));

    expect(names).toContain(SessionsField.InsightSentiment);
  });

  // The comparison operators are scalar and reject an array operand, which is what the column's old
  // `filter: false` was written against. A text filter over an array reaches the query as an `arrayFilters`
  // entry instead, never as a `columnFilters` comparison.
  test('refuses a scalar comparison naming an array field rather than approximating one', () => {
    expect(() =>
      buildList({
        columnFilters: [
          {
            field: SessionsField.Traces,
            operator: SessionFilterOperator.Contains,
            value: 'gpt-4.1',
          },
        ],
      }),
    ).toThrow(SessionsField.Traces);
  });

  test('projects a source-backed field alongside the curated ones, hidden or not', () => {
    const names = selectNames(buildList({ sourceFields: ['success_count'] }));

    expect(names).toContain('success_count');
    expect(names).toContain(SessionsField.ChatId);
  });

  test('projects an enrichment-backed field only while its column is visible', () => {
    const visible = selectNames(buildList({ visibleEnrichmentFields: ['session_insights.topic'] }));

    expect(visible).toContain('session_insights.topic');
    expect(selectNames(buildList())).not.toContain('session_insights.topic');
  });

  test('names a curated field once even when it is reported as a source field', () => {
    const names = selectNames(buildList({ sourceFields: [SessionsField.ChatId] }));

    expect(names.filter((name) => name === SessionsField.ChatId)).toHaveLength(1);
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

describe('buildSessionListQuery :: filter', () => {
  test('bounds last activity, not the underlying request time', () => {
    const args = groupArgs(buildList().filter);
    const bounds = args.filter((node) => [QueryOperator.Ge, QueryOperator.Le].includes(node.op));

    expect(bounds.map(fieldName)).toEqual([SessionsField.LastRequestTime, SessionsField.LastRequestTime]);
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

describe('buildSessionListQuery :: search', () => {
  const searchGroup = (search: string): QueryGroup =>
    groupArgs(buildList({ search }).filter).find(
      (node) => (node as unknown as QueryGroup).op === QueryLogicalOperator.Or,
    ) as unknown as QueryGroup;

  test('a term becomes one OR of two contains predicates on the id and the project', () => {
    const group = searchGroup('acme');
    const predicates = group.args as QueryPredicate[];

    expect(predicates).toHaveLength(2);
    expect(predicates.map((node) => node.op)).toEqual([QueryOperator.Ico, QueryOperator.Ico]);
    expect(predicates.map(fieldName)).toEqual([SessionsField.ChatId, SessionsField.ProjectId]);
    expect(predicates.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual(['acme', 'acme']);
  });

  test('search does not reach the user hash', () => {
    const predicates = searchGroup('acme').args as QueryPredicate[];

    expect(predicates.map(fieldName)).not.toContain(SessionsField.UserHash);
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

describe('buildSessionListQuery :: column filters', () => {
  const predicateFor = (columnFilters: SessionColumnFilter[]) =>
    groupArgs(buildList({ columnFilters }).filter).slice(2);

  test.each<[SessionScalarOperator, QueryOperator]>([
    [SessionFilterOperator.Contains, QueryOperator.Ico],
    [SessionFilterOperator.NotContains, QueryOperator.Inc],
    [SessionFilterOperator.Equals, QueryOperator.Eq],
    [SessionFilterOperator.NotEquals, QueryOperator.Ne],
  ])('a %s filter conjoins a %s predicate', (operator, expected) => {
    const [node] = predicateFor([{ field: SessionsField.ProjectId, operator, value: 'acme' }]);

    expect(node.op).toBe(expected);
    expect(fieldName(node)).toBe(SessionsField.ProjectId);
    expect((node.args[1] as QueryValueExpr).value).toBe('acme');
  });

  test.each<[SessionScalarOperator, QueryOperator]>([
    [SessionFilterOperator.GreaterThan, QueryOperator.Gt],
    [SessionFilterOperator.GreaterThanOrEqual, QueryOperator.Ge],
    [SessionFilterOperator.LessThan, QueryOperator.Lt],
    [SessionFilterOperator.LessThanOrEqual, QueryOperator.Le],
  ])('a %s filter conjoins a %s predicate', (operator, expected) => {
    const [node] = predicateFor([{ field: SessionsField.TurnCount, operator, value: '5' }]);

    expect(node.op).toBe(expected);
  });

  test('a range becomes a ge and an le on the same field', () => {
    const [group] = predicateFor([
      {
        field: SessionsField.TotalTokens,
        operator: SessionFilterOperator.Range,
        value: '10',
        valueTo: '20',
      },
    ]);
    const bounds = (group as unknown as QueryGroup).args as QueryPredicate[];

    expect(bounds.map((node) => node.op)).toEqual([QueryOperator.Ge, QueryOperator.Le]);
    expect(bounds.map(fieldName)).toEqual([SessionsField.TotalTokens, SessionsField.TotalTokens]);
    expect(bounds.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual(['10', '20']);
  });

  test.each([
    [SessionsField.ChatId, QueryValueType.String],
    [SessionsField.TurnCount, QueryValueType.Integer],
    [SessionsField.TotalPrice, QueryValueType.Decimal],
  ])('a filter on %s carries the %s value type', (targetField, valueType) => {
    const [node] = predicateFor([
      { field: targetField, operator: SessionFilterOperator.Equals, value: '0.090000000001' },
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
        columnFilters: [{ field: SessionsField.TurnCount, operator: SessionFilterOperator.GreaterThan, value: '2' }],
      }).filter,
    );

    expect(args).toHaveLength(4);
    expect(args.at(-1)?.op).toBe(QueryOperator.Gt);
  });
});

describe('buildSessionListQuery :: feedback predicate', () => {
  const rateNode = (feedback: FeedbackFilter, source: SessionsSource = RATED_SOURCE) =>
    groupArgs(buildList({ feedback, source }).filter).slice(2)[0];

  test('Positive narrows on the enrichment positive count alone', () => {
    expect(rateNode(FeedbackFilter.Positive)).toEqual({
      op: QueryOperator.Gt,
      args: [
        { type: QueryExprType.Field, name: `${RATING_NAMESPACE}.${ResponseRatingsField.RatePosCount}` },
        { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '0' },
      ],
    });
  });

  test('Negative is a union over the non-positive counts, zero included', () => {
    const node = rateNode(FeedbackFilter.Negative) as unknown as QueryGroup;

    expect(String(node.op)).toBe(QueryLogicalOperator.Or);
    expect((node.args as QueryPredicate[]).map(fieldName)).toEqual([
      `${RATING_NAMESPACE}.${ResponseRatingsField.RateZeroCount}`,
      `${RATING_NAMESPACE}.${ResponseRatingsField.RateNegCount}`,
    ]);
    (node.args as QueryPredicate[]).forEach((arg) => expect(arg.op).toBe(QueryOperator.Gt));
  });

  test('Rated is a union over every value-bearing count', () => {
    const node = rateNode(FeedbackFilter.Rated) as unknown as QueryGroup;

    expect((node.args as QueryPredicate[]).map(fieldName)).toEqual([
      `${RATING_NAMESPACE}.${ResponseRatingsField.RatePosCount}`,
      `${RATING_NAMESPACE}.${ResponseRatingsField.RateZeroCount}`,
      `${RATING_NAMESPACE}.${ResponseRatingsField.RateNegCount}`,
    ]);
  });

  test('reads the counts of whichever namespace the source names as its rating enrichment', () => {
    const node = rateNode(FeedbackFilter.Positive, CUSTOM_SOURCE);

    expect(fieldName(node)).toBe(`custom_ratings.${ResponseRatingsField.RatePosCount}`);
  });

  test('All adds no rate predicate', () => {
    expect(groupArgs(buildList({ feedback: FeedbackFilter.All, source: RATED_SOURCE }).filter)).toHaveLength(2);
  });

  test.each([FeedbackFilter.Positive, FeedbackFilter.Negative, FeedbackFilter.Rated])(
    'a %s filter adds no predicate when the source has no rating enrichment',
    (feedback) => {
      expect(groupArgs(buildList({ feedback }).filter)).toHaveLength(2);
      expect(JSON.stringify(buildList({ feedback }).filter)).not.toContain('rate_');
    },
  );

  test('names no candidate session ids', () => {
    const args = groupArgs(buildList({ feedback: FeedbackFilter.Rated, source: RATED_SOURCE }).filter);

    expect(args.some((node) => node.op === QueryOperator.In)).toBe(false);
  });

  test('the predicate composes with search and the time bounds', () => {
    const args = groupArgs(
      buildList({ search: 'acme', feedback: FeedbackFilter.Positive, source: RATED_SOURCE }).filter,
    );

    expect(args).toHaveLength(4);
    expect(args.at(-1)?.op).toBe(QueryOperator.Gt);
  });
});

describe('buildSessionListQuery :: rating enrichment projection', () => {
  test('projects the rating enrichment count fields whatever columns are visible', () => {
    const names = selectNames(buildList({ source: RATED_SOURCE, sourceFields: [SessionsField.ChatId] }));

    expect(names).toEqual(
      expect.arrayContaining(SESSION_RATING_SELECT_FIELDS.map((name) => `${RATING_NAMESPACE}.${name}`)),
    );
  });

  test('projects no rating field without a rating enrichment', () => {
    expect(selectNames(buildList()).some((name) => name.includes('rate_'))).toBe(false);
  });
});

describe('buildSessionListQuery :: a custom source', () => {
  const buildCustom = (overrides: Partial<Parameters<typeof buildSessionListQuery>[0]> = {}) =>
    buildList({ source: CUSTOM_SOURCE, ...overrides });

  test('reads the bound base table', () => {
    expect(buildCustom().entity).toBe('agent_runs');
  });

  test('always projects the role-bound fields, even with a classified field list', () => {
    const names = selectNames(buildCustom({ sourceFields: ['region'] }));

    expect(names.slice(0, 3)).toEqual(['run_key', 'ended_at', 'steps']);
    expect(names).toContain('region');
  });

  test('projects a requested canonical field under the name its role is bound to', () => {
    const names = selectNames(buildCustom({ sourceFields: [SessionsField.TurnCount] }));

    expect(names).toContain('steps');
    expect(names).not.toContain(SessionsField.TurnCount);
  });

  test('drops a requested canonical field whose role is unbound', () => {
    const names = selectNames(buildCustom({ sourceFields: [SessionsField.TotalPrice, SessionsField.ProjectId] }));

    expect(names).not.toContain(SessionsField.TotalPrice);
    expect(names).not.toContain(SessionsField.ProjectId);
  });

  test('bounds the period by the Time field', () => {
    const bounds = groupArgs(buildCustom().filter);

    expect(bounds.map(fieldName)).toEqual(['ended_at', 'ended_at']);
  });

  test('searches the session id alone when no Project is bound', () => {
    const group = groupArgs(buildCustom({ search: 'acme' }).filter)[2] as unknown as QueryGroup;

    expect((group.args as QueryPredicate[]).map(fieldName)).toEqual(['run_key']);
  });

  test('sorts by the Time field and breaks ties on the session id', () => {
    expect(buildCustom().sort).toEqual([
      { field: 'ended_at', dir: QuerySortDirection.Desc },
      { field: 'run_key', dir: QuerySortDirection.Asc },
    ]);
  });

  test('maps a caller sort key and a column filter on a canonical field to the bound field', () => {
    const query = buildCustom({
      sort: [{ field: SessionsField.TurnCount, direction: QuerySortDirection.Desc }],
      columnFilters: [{ field: SessionsField.TurnCount, operator: SessionFilterOperator.GreaterThan, value: '3' }],
    });

    expect(query.sort?.[0].field).toBe('steps');
    expect(fieldName(groupArgs(query.filter).at(-1) as QueryPredicate)).toBe('steps');
  });
});

describe('buildSessionListQuery :: sort, page and purity', () => {
  test('orders by last activity with a stable id tiebreaker last when no caller key is given', () => {
    const sort = buildList().sort;

    expect(sort).toEqual([
      { field: SessionsField.LastRequestTime, dir: QuerySortDirection.Desc },
      { field: SessionsField.ChatId, dir: QuerySortDirection.Asc },
    ]);
    expect(sort?.at(-1)?.field).toBe(SessionsField.ChatId);
  });

  test('puts a caller sort key before the tiebreaker and orders its nulls last', () => {
    const sort = buildList({
      sort: [{ field: SessionsField.TotalPrice, direction: QuerySortDirection.Desc }],
    }).sort;

    expect(sort).toEqual([
      { field: SessionsField.TotalPrice, dir: QuerySortDirection.Desc, nulls: QuerySortNulls.Last },
      { field: SessionsField.ChatId, dir: QuerySortDirection.Asc },
    ]);
  });

  test('appends the tiebreaker even when the caller sorts by the id itself', () => {
    const sort = buildList({
      sort: [{ field: SessionsField.ChatId, direction: QuerySortDirection.Desc }],
    }).sort;

    expect(sort).toHaveLength(2);
    expect(sort?.at(-1)).toEqual({ field: SessionsField.ChatId, dir: QuerySortDirection.Asc });
  });

  test('keeps several caller keys in order, each with a nulls ordering', () => {
    const sort = buildList({
      sort: [
        { field: SessionsField.ProjectId, direction: QuerySortDirection.Asc },
        { field: SessionsField.TotalTokens, direction: QuerySortDirection.Desc },
      ],
    }).sort;

    expect(sort?.map((item) => item.field)).toEqual([
      SessionsField.ProjectId,
      SessionsField.TotalTokens,
      SessionsField.ChatId,
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

describe('buildSessionTotalsQuery', () => {
  const buildTotals = () => buildSessionTotalsQuery(RANGE);

  test('counts sessions and sums cost over the period', () => {
    const query = buildTotals();

    expect(query.entity).toBe('sessions');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toBeUndefined();
    expect(query.select).toEqual([
      { expr: { type: QueryExprType.Fn, name: 'count', args: [] }, as: SessionTotalsField.Sessions },
      {
        expr: {
          type: QueryExprType.Fn,
          name: 'sum',
          args: [{ type: QueryExprType.Field, name: SessionsField.TotalPrice }],
        },
        as: SessionTotalsField.Cost,
      },
    ]);
  });

  test('omits the cost sum without a Cost role and reads the bound table and Time field', () => {
    const query = buildSessionTotalsQuery(RANGE, CUSTOM_SOURCE);

    expect(query.entity).toBe('agent_runs');
    expect(query.select).toEqual([
      { expr: { type: QueryExprType.Fn, name: 'count', args: [] }, as: SessionTotalsField.Sessions },
    ]);
    expect(groupArgs(query.filter).map(fieldName)).toEqual(['ended_at', 'ended_at']);
  });

  test('sums the field the Cost role is bound to', () => {
    const query = buildSessionTotalsQuery(RANGE, { ...CUSTOM_SOURCE, cost: 'spend' });

    expect(JSON.stringify(query.select?.[1])).toContain('"spend"');
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
      expect(fieldName(node)).toBe(SessionsField.LastRequestTime);
      expect([QueryOperator.Ge, QueryOperator.Le]).toContain(node.op);
    });
  });

  test('is narrower than the list query whenever the list is filtered', () => {
    expect(buildTotals().filter).not.toEqual(buildList({ search: 'acme' }).filter);
    expect(buildTotals().filter).not.toEqual(
      buildList({ feedback: FeedbackFilter.Rated, source: RATED_SOURCE }).filter,
    );
  });
});

describe('buildSessionRatingTotalsQuery', () => {
  const build = (feedback: FeedbackFilter, source: SessionsSource = RATED_SOURCE) =>
    buildSessionRatingTotalsQuery({ range: RANGE, feedback, source });

  test('counts sessions of the base entity', () => {
    const query = build(FeedbackFilter.Rated);

    expect(query.entity).toBe('sessions');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.select).toEqual([
      { expr: { type: QueryExprType.Fn, name: 'count', args: [] }, as: SessionRatingTotalsField.Sessions },
    ]);
  });

  test('groups by nothing and takes no page — one row is the whole answer', () => {
    expect(build(FeedbackFilter.Rated).group_by).toBeUndefined();
    expect(build(FeedbackFilter.Rated).page).toBeUndefined();
  });

  test('bounds the count by the session Time field', () => {
    const bounds = groupArgs(build(FeedbackFilter.Rated).filter).filter((node) =>
      [QueryOperator.Ge, QueryOperator.Le].includes(node.op),
    );

    expect(bounds.map(fieldName)).toEqual([SessionsField.LastRequestTime, SessionsField.LastRequestTime]);
  });

  test('narrows by the same predicate the list query carries', () => {
    const totals = groupArgs(build(FeedbackFilter.Negative).filter);
    const list = groupArgs(buildList({ feedback: FeedbackFilter.Negative, source: RATED_SOURCE }).filter);

    expect(totals).toEqual(list);
  });

  test('the rated and negative counts ask different questions of the same rows', () => {
    expect(build(FeedbackFilter.Rated).filter).not.toEqual(build(FeedbackFilter.Negative).filter);
  });

  test('reads a custom base table under its own Time field', () => {
    const query = build(FeedbackFilter.Rated, CUSTOM_SOURCE);

    expect(query.entity).toBe('agent_runs');
    expect(groupArgs(query.filter).slice(0, 2).map(fieldName)).toEqual(['ended_at', 'ended_at']);
  });

  test('is pure — same inputs, same query, and it never reads the clock', () => {
    expect(build(FeedbackFilter.Negative)).toEqual(build(FeedbackFilter.Negative));
  });
});

describe('buildSessionRatedResponsesQuery', () => {
  const WINDOW = { fromMs: 1000, toMs: 2000 };

  const build = (overrides: Partial<Parameters<typeof buildSessionRatedResponsesQuery>[0]> = {}) =>
    buildSessionRatedResponsesQuery({
      scope: { id: 'chat-1', source: 'chat_id' },
      window: WINDOW,
      namespace: RATING_NAMESPACE,
      limit: 50,
      isCommentTextReadable: true,
      ...overrides,
    });

  const aliases = (query: StructuredQuery) => (query.select as QueryOutputColumn[]).slice(1).map(({ as }) => as);

  test('groups the usage log by response id', () => {
    const query = build();

    expect(query.entity).toBe(USAGE_LOG_ENTITY);
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual([UsageLogField.ResponseId]);
    expect(query.select?.[0]).toEqual({ expr: { type: QueryExprType.Field, name: UsageLogField.ResponseId } });
  });

  test('takes the max of each namespaced rating field under its bare name', () => {
    const [first] = (build().select as QueryOutputColumn[]).slice(1);

    expect(first).toEqual({
      expr: {
        type: QueryExprType.Fn,
        name: 'max',
        args: [{ type: QueryExprType.Field, name: `${RATING_NAMESPACE}.${ResponseRatingsField.FirstRateTime}` }],
      },
      as: ResponseRatingsField.FirstRateTime,
    });
  });

  test('reads the comment sample only where comment text is readable', () => {
    expect(aliases(build())).toContain(ResponseRatingsField.CommentSample);
    expect(aliases(build({ isCommentTextReadable: false }))).not.toContain(ResponseRatingsField.CommentSample);
    expect(aliases(build({ isCommentTextReadable: false }))).toContain(ResponseRatingsField.CommentCount);
  });

  test('scopes by the session, the window and a positive rate event count', () => {
    const args = groupArgs(build().filter);

    expect(args.map(fieldName)).toEqual([
      UsageLogField.ChatId,
      UsageLogField.RequestTime,
      UsageLogField.RequestTime,
      `${RATING_NAMESPACE}.${ResponseRatingsField.RateEventCount}`,
    ]);
    expect(args.map((node) => (node.args[1] as QueryValueExpr).value)).toEqual(['chat-1', '1000', '2000', '0']);
    expect(args.at(-1)?.op).toBe(QueryOperator.Gt);
  });

  test('scopes a non-chat session by the client session id', () => {
    const args = groupArgs(build({ scope: { id: 'run-1', source: 'harness' } }).filter);

    expect(fieldName(args[0])).toBe(UsageLogField.ClientSessionId);
  });

  test('orders by the latest rating with a stable tiebreaker and pages by the limit', () => {
    const query = build({ limit: 7 });

    expect(query.sort).toEqual([
      { field: ResponseRatingsField.LastRateTime, dir: QuerySortDirection.Desc },
      { field: UsageLogField.ResponseId, dir: QuerySortDirection.Asc },
    ]);
    expect((query.page as QueryOffsetPage).limit).toBe(7);
  });
});

describe('buildSessionTracePageQuery', () => {
  const WINDOW = { fromMs: 1000, toMs: 2000 };

  test('filters by the project when one is known', () => {
    const args = groupArgs(
      buildSessionTracePageQuery({ id: 'chat-1', source: 'chat_id' }, 'acme', WINDOW, 0, 10).filter,
    );

    expect(args.map(fieldName)).toContain(UsageLogField.ProjectId);
  });

  test('drops the project predicate when the session has no project', () => {
    const args = groupArgs(buildSessionTracePageQuery({ id: 'chat-1', source: 'chat_id' }, null, WINDOW, 0, 10).filter);

    expect(args.map(fieldName)).toEqual([UsageLogField.ChatId, UsageLogField.RequestTime, UsageLogField.RequestTime]);
  });
});

const BODY_COLUMNS = [UsageLogField.RequestBody, UsageLogField.ResponseBody, UsageLogField.AssembledResponse];

const flatPredicates = (query: StructuredQuery): QueryPredicate[] =>
  groupArgs(query.filter).flatMap((node) => (String(node.op) === QueryLogicalOperator.And ? groupArgs(node) : [node]));

const predicateFor = (query: StructuredQuery, name: string): QueryPredicate | undefined =>
  flatPredicates(query).find((node) => fieldName(node) === name);

// The time bound is two predicates over one field, so `predicateFor` would only ever see the lower one.
const timePredicates = (query: StructuredQuery): QueryPredicate[] =>
  flatPredicates(query).filter((node) => fieldName(node) === UsageLogField.RequestTime);

describe('buildSessionHopBodyQuery', () => {
  const query = buildSessionHopBodyQuery('tr1', 'sp1', '2026-08-18T11:33:17.216Z', BODY_COLUMNS);

  // One hop at a time, never in bulk: a measured 384-hop turn carried 99.26 MiB of request bodies, one hop of
  // it reaching 4.00 MiB.
  test('narrows to exactly one hop', () => {
    expect((predicateFor(query, UsageLogField.TraceId)?.args?.[1] as QueryValueExpr).value).toBe('tr1');
    expect((predicateFor(query, UsageLogField.CoreSpanId)?.args?.[1] as QueryValueExpr).value).toBe('sp1');
    expect((query.page as QueryOffsetPage).limit).toBe(1);
  });

  // The table partitions on the day of `request_time`, and one hop is one instant, so the range collapses to
  // a single partition.
  test('bounds the read by the hop own instant, as a range in epoch millis', () => {
    const times = timePredicates(query);

    expect(times.map(({ op }) => op)).toEqual([QueryOperator.Ge, QueryOperator.Le]);
    expect(times.map((time) => (time.args?.[1] as QueryValueExpr).value)).toEqual(['1787052797216', '1787052797216']);
  });

  test('bounds nothing when the hop records no time, rather than sending an unparseable literal', () => {
    expect(timePredicates(buildSessionHopBodyQuery('tr1', 'sp1', null, BODY_COLUMNS))).toHaveLength(0);
  });

  test('names the assembled column only where the schema reports it', () => {
    expect(selectNames(query)).toContain(UsageLogField.AssembledResponse);
    expect(
      selectNames(buildSessionHopBodyQuery('tr1', 'sp1', 1, [UsageLogField.RequestBody, UsageLogField.ResponseBody])),
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

// The session predicate was once the contract every hop-log query in this view kept; it withheld the bodies of
// hops recorded with an empty session header — see `buildSessionHopBodyQuery` for the full account.
// The listing queries keep their session scope, which `session-detail-queries.spec.ts` holds them to.
describe('the hop body query is addressed by the hop, not by the session', () => {
  const filter = JSON.stringify(buildSessionHopBodyQuery('tr1', 'sp1', 1, BODY_COLUMNS).filter);

  test('carries neither session column, whatever the session was scoped by', () => {
    expect(filter).not.toContain(UsageLogField.ChatId);
    expect(filter).not.toContain(UsageLogField.ClientSessionId);
  });

  test('keeps the trace, the span and the recorded instant', () => {
    expect(filter).toContain(UsageLogField.TraceId);
    expect(filter).toContain(UsageLogField.CoreSpanId);
    expect(filter).toContain(UsageLogField.RequestTime);
  });
});

// The array predicates match whole elements, so a contains filter has to resolve its text to whole values
// first — which is why such a filter is two queries.
describe('an array column filters in two steps', () => {
  const DEPLOYMENTS_SOURCE = SESSION_ARRAY_VALUE_SOURCE[SessionsField.Deployments]!;

  const resolution = (term = 'gpt', offset = 0) =>
    buildArrayValueResolutionQuery({ source: DEPLOYMENTS_SOURCE, range: RANGE, term, offset });

  const arrayFilter = (operator: SessionScalarOperator, values: string[]): SessionArrayFilter[] => [
    { field: SessionsField.Deployments, operator, values },
  ];

  const arrayPredicate = (operator: SessionScalarOperator, values: string[]): QueryPredicate =>
    groupArgs(buildList({ arrayFilters: arrayFilter(operator, values) }).filter).at(-1) as QueryPredicate;

  const callOf = (node: QueryPredicate): QueryFnExpr => node.args[0] as QueryFnExpr;

  test('the resolution reads the scalar column the array is built from, grouped', () => {
    const query = resolution();

    expect(query.entity).toBe(USAGE_LOG_ENTITY);
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual([UsageLogField.Deployment]);
    expect(selectNames(query)).toEqual([UsageLogField.Deployment]);
  });

  test('the resolution is scoped to the period and matches the entered text', () => {
    const predicates = groupArgs(resolution('gpt').filter);
    const term = predicates.find((node) => node.op === QueryOperator.Ico);

    expect(predicates.filter((node) => fieldName(node) === UsageLogField.RequestTime)).toHaveLength(2);
    expect(fieldName(term as QueryPredicate)).toBe(UsageLogField.Deployment);
    expect((term?.args?.[1] as QueryValueExpr).value).toBe('gpt');
  });

  // Naming no page is not "unpaged" — the service applies its own default of 100 rows — and a limit above
  // the ceiling is rejected rather than clamped.
  test('the resolution reads a full page of the service ceiling', () => {
    expect(resolution().page).toMatchObject({ offset: 0, limit: ARRAY_VALUE_PAGE_SIZE });
  });

  test('the resolution pages by offset', () => {
    expect((resolution('gpt', ARRAY_VALUE_PAGE_SIZE).page as QueryOffsetPage).offset).toBe(ARRAY_VALUE_PAGE_SIZE);
  });

  // Without it the pages would overlap and miss values, so the walk could not be exhaustive.
  test('the resolution orders the values so its pages are disjoint', () => {
    expect(resolution().sort).toEqual([{ field: UsageLogField.Deployment, dir: QuerySortDirection.Asc }]);
  });

  test('a contains filter tests membership in the resolved set', () => {
    const node = arrayPredicate(SessionFilterOperator.Contains, ['gpt-4o', 'gpt-4o-mini']);
    const call = callOf(node);

    expect(call.name).toBe('array_has_any');
    expect((call.args[0] as QueryFieldExpr).name).toBe(SessionsField.Deployments);
    expect((call.args[1] as { items: QueryValueExpr[] }).items.map((item) => item.value)).toEqual([
      'gpt-4o',
      'gpt-4o-mini',
    ]);
    expect((node.args[1] as QueryValueExpr).value).toBe('true');
  });

  test('an equals filter tests one element without a resolution step', () => {
    const node = arrayPredicate(SessionFilterOperator.Equals, ['gpt-4o']);
    const call = callOf(node);

    expect(call.name).toBe('array_has');
    expect((call.args[1] as QueryValueExpr).value).toBe('gpt-4o');
    expect((node.args[1] as QueryValueExpr).value).toBe('true');
  });

  // Not reachable through the grid, where `equals` carries one value. Asserted because the alternative to
  // widening is silent: `array_has` takes one element, so a second value would vanish with no error.
  test('an equals filter carrying several values widens rather than dropping them', () => {
    const node = arrayPredicate(SessionFilterOperator.Equals, ['gpt-4o', 'gpt-4o-mini']);
    const call = callOf(node);

    expect(call.name).toBe('array_has_any');
    expect((call.args[1] as { items: QueryValueExpr[] }).items).toHaveLength(2);
  });

  test.each<[SessionScalarOperator, string]>([
    [SessionFilterOperator.NotContains, 'array_has_any'],
    [SessionFilterOperator.NotEquals, 'array_has'],
  ])('a %s filter holds where no element matches', (operator, expected) => {
    const node = arrayPredicate(operator, ['claude-sonnet']);

    expect(callOf(node).name).toBe(expected);
    expect((node.args[1] as QueryValueExpr).value).toBe('false');
  });

  // No value matched the text, so no session does — and the filter is still stated, because the header
  // shows one and the query has to mean what it shows.
  test('a positive filter that resolved nothing matches nothing', () => {
    const node = arrayPredicate(SessionFilterOperator.Contains, []);

    expect(node.op).toBe(QueryOperator.Lt);
    expect(callOf(node).name).toBe('array_length');
    expect((node.args[1] as QueryValueExpr).value).toBe('0');
  });

  // The mirror image: no element can equal a value that does not exist, so every session satisfies it.
  test('a negated filter that resolved nothing matches everything', () => {
    const node = arrayPredicate(SessionFilterOperator.NotContains, []);

    expect(node.op).toBe(QueryOperator.Ge);
    expect(callOf(node).name).toBe('array_length');
  });
});

describe('buildSessionFieldValuesQuery', () => {
  const ENUM_FIELD = SessionsField.InsightSentiment;

  const build = (overrides: Partial<Parameters<typeof buildSessionFieldValuesQuery>[0]> = {}) =>
    buildSessionFieldValuesQuery({ field: ENUM_FIELD, range: RANGE, ...overrides });

  const textFilter = (field: string, value: string): SessionColumnFilter => ({
    field,
    operator: SessionFilterOperator.Contains,
    value,
  });

  test('groups by the field and counts each value', () => {
    const query = build();

    expect(query.entity).toBe('sessions');
    expect(query.mode).toBe(QueryMode.Aggregate);
    expect(query.group_by).toEqual([ENUM_FIELD]);
    expect((query.select as QueryOutputColumn[])[1]).toEqual({
      expr: { type: QueryExprType.Fn, name: 'count', args: [] },
      as: SESSION_FIELD_VALUE_COUNT_ALIAS,
    });
  });

  test('orders by the count descending, breaking ties on the value', () => {
    expect(build().sort).toEqual([
      { field: SESSION_FIELD_VALUE_COUNT_ALIAS, dir: QuerySortDirection.Desc },
      { field: ENUM_FIELD, dir: QuerySortDirection.Asc },
    ]);
    expect((build().page as QueryOffsetPage).limit).toBe(SESSION_FIELD_VALUE_LIMIT);
  });

  test('carries the period, the search term and the feedback predicate', () => {
    const query = build({ search: 'acme', feedback: FeedbackFilter.Positive, source: RATED_SOURCE });
    const predicates = groupArgs(query.filter);

    expect(predicates.filter((node) => fieldName(node) === SessionsField.LastRequestTime)).toHaveLength(2);
    expect(JSON.stringify(query.filter)).toContain('acme');
    expect(JSON.stringify(query.filter)).toContain(`${RATING_NAMESPACE}.${ResponseRatingsField.RatePosCount}`);
  });

  test('groups a canonical field under the name its role is bound to on a custom source', () => {
    const query = build({ field: SessionsField.TurnCount, source: CUSTOM_SOURCE });

    expect(query.entity).toBe('agent_runs');
    expect(query.group_by).toEqual(['steps']);
  });

  test("carries another column's filter", () => {
    const query = build({ columnFilters: [textFilter(SessionsField.ProjectId, 'acme')] });

    expect(JSON.stringify(query.filter)).toContain(SessionsField.ProjectId);
  });

  // Including it would collapse the list to what is already selected, so a selection could never be widened
  // without first being cleared.
  test("omits the opened column's own filter", () => {
    const query = build({
      columnFilters: [
        textFilter(SessionsField.ProjectId, 'acme'),
        { field: ENUM_FIELD, operator: SessionFilterOperator.In, values: ['positive'] },
      ],
    });

    expect(JSON.stringify(query.filter)).toContain(SessionsField.ProjectId);
    expect(JSON.stringify(query.filter)).not.toContain('positive');
  });

  test("omits the opened column's own array filter", () => {
    const query = build({
      field: SessionsField.Deployments,
      arrayFilters: [
        {
          field: SessionsField.Deployments,
          operator: SessionFilterOperator.Contains,
          values: ['gpt-4o'],
        },
      ],
    });

    expect(JSON.stringify(query.filter)).not.toContain('gpt-4o');
  });
});
