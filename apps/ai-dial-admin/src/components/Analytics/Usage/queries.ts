import {
  BREAKDOWN_TAB_COLUMN,
  BUCKET_ROW_LIMIT,
  USAGE_ENTITY,
  USAGE_VIEW_EVENT_KINDS,
} from '@/src/components/Analytics/Usage/constants';
import { BreakdownTab, SpendScaleUnit, UsageView } from '@/src/components/Analytics/Usage/models';
import {
  QueryExpr,
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QuerySortDirection,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import { ChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

export interface QueryScope {
  view: UsageView;
  window: TimeRange;
  entityFilter?: string | null;
  projectFilter?: string | null;
}

const field = (name: string): QueryExpr => ({ type: QueryExprType.Field, name });

const value = (raw: string, valueType = QueryValueType.String): QueryExpr => ({
  type: QueryExprType.Value,
  value_type: valueType,
  value: raw,
});

const fn = (name: string, args: QueryExpr[], distinct?: boolean): QueryExpr => ({
  type: QueryExprType.Fn,
  name,
  args,
  ...(distinct ? { distinct } : {}),
});

const eventKindFilter = (view: UsageView): QueryFilterNode => ({
  op: QueryOperator.In,
  args: [
    field('event_kind'),
    {
      type: QueryExprType.Array,
      items: USAGE_VIEW_EVENT_KINDS[view].map(
        (kind) => ({ type: QueryExprType.Value, value_type: QueryValueType.String, value: kind }) as const,
      ),
    },
  ],
});

/**
 * The backend parses a timestamp literal as epoch millis and rejects an ISO string with
 * "invalid long/timestamp literal" — the same contract the query builder's own time bound follows.
 */
const timestampValue = (date: Date): QueryExpr => ({
  type: QueryExprType.Value,
  value_type: QueryValueType.Timestamp,
  value: String(date.getTime()),
});

export const buildFilter = (scope: QueryScope, extra: QueryFilterNode[] = []): QueryFilterNode => {
  const clauses: QueryFilterNode[] = [
    eventKindFilter(scope.view),
    { op: QueryOperator.Ge, args: [field('request_time'), timestampValue(scope.window.startDate)] },
    { op: QueryOperator.Lt, args: [field('request_time'), timestampValue(scope.window.endDate)] },
    ...extra,
  ];

  if (scope.entityFilter) {
    clauses.push({ op: QueryOperator.Eq, args: [field('deployment'), value(scope.entityFilter)] });
  }
  if (scope.projectFilter) {
    clauses.push({ op: QueryOperator.Eq, args: [field('project_id'), value(scope.projectFilter)] });
  }

  return { op: QueryLogicalOperator.And, args: clauses };
};

/** The principal that made the call: the user id on a token call, the project id on an API-key one. */
const USER_REF_FIELD = 'usage_client_identity.user_ref';

export const CALLS_ALIAS = 'calls';
export const SPEND_ALIAS = 'spend';
export const PROMPT_TOKENS_ALIAS = 'prompt_tokens';
export const COMPLETION_TOKENS_ALIAS = 'completion_tokens';
export const FAILED_ALIAS = 'failed';
export const AVG_LATENCY_ALIAS = 'avg_latency';
export const CALLERS_ALIAS = 'callers';
export const BUCKET_ALIAS = 'bucket';
export const TOOL_CALLS_ALIAS = 'tool_calls';
export const P50_LATENCY_ALIAS = 'p50_latency';
export const P95_LATENCY_ALIAS = 'p95_latency';

/**
 * The figures every aggregate carries. `failed` counts rows whose `success` is false — the DSL has
 * no comparison in expression position, but `success` is already a boolean, so `if` takes it
 * directly.
 */
const commonMeasures = (view: UsageView) => {
  const measures = [
    { expr: fn('count', []), as: CALLS_ALIAS },
    // `user_hash` is set only on token calls and empty on every API-key one, so counting it folds
    // all key traffic into a single bucket. `user_ref` is populated on both branches — the user id
    // for a token call, the project the key belongs to for a key call.
    { expr: fn('count', [field(USER_REF_FIELD)], true), as: CALLERS_ALIAS },
    {
      expr: fn('sum', [
        fn('if', [field('success'), value('0', QueryValueType.Integer), value('1', QueryValueType.Integer)]),
      ]),
      as: FAILED_ALIAS,
    },
    { expr: fn('avg', [field('operation_duration_ms')]), as: AVG_LATENCY_ALIAS },
  ];

  if (view === UsageView.Llm) {
    // Spend and tokens are summed over the same rows, so a figure derived from both — cost per
    // 1M tokens — divides two numbers with one basis. An earlier guard counted tokens only where
    // `response_upstream_uri` was set, on the theory that the empty ones were orchestrator rows
    // repeating their children's tokens. Measured, they are not: the rows without it are ordinary
    // model calls carrying half of all spend, while an application's own row carries no price and
    // 0.2% of the tokens.
    return [
      ...measures,
      { expr: fn('sum', [field('deployment_price')]), as: SPEND_ALIAS },
      { expr: fn('sum', [field('prompt_tokens')]), as: PROMPT_TOKENS_ALIAS },
      { expr: fn('sum', [field('completion_tokens')]), as: COMPLETION_TOKENS_ALIAS },
    ];
  }

  return [
    ...measures,
    {
      expr: fn('sum', [
        fn('if', [
          fn('equals', [field('mcp_method'), value('tools/call')]),
          value('1', QueryValueType.Integer),
          value('0', QueryValueType.Integer),
        ]),
      ]),
      as: TOOL_CALLS_ALIAS,
    },
  ];
};

/**
 * Percentiles ride only on the bucketed request. They are an ordered-set aggregate — the engine has
 * to sort each group — so the totals and the per-dimension rows, which need no distribution, do not
 * pay for them.
 */
const latencyPercentiles = () => [
  {
    expr: fn('percentile_cont', [value('0.5', QueryValueType.Decimal), field('operation_duration_ms')]),
    as: P50_LATENCY_ALIAS,
  },
  {
    expr: fn('percentile_cont', [value('0.95', QueryValueType.Decimal), field('operation_duration_ms')]),
    as: P95_LATENCY_ALIAS,
  },
];

const BUCKET_UNIT: Record<ChartResolution['unit'], string> = { m: 'minute', h: 'hour', d: 'day' };

/**
 * Calls over time. One window per request: the grammar has no comparison in expression position, so
 * a single aggregate cannot split its own rows into two windows — the caller asks per window and
 * the bucketed response is cut by bucket timestamp on the client.
 */
export const buildBucketedQuery = (scope: QueryScope, resolution: ChartResolution): StructuredQuery => ({
  entity: USAGE_ENTITY,
  mode: QueryMode.Aggregate,
  filter: buildFilter(scope),
  select: [
    {
      expr: fn('date_bin', [
        value(String(resolution.value), QueryValueType.Integer),
        value(BUCKET_UNIT[resolution.unit]),
        field('request_time'),
      ]),
      as: BUCKET_ALIAS,
    },
    ...commonMeasures(scope.view),
    ...latencyPercentiles(),
  ],
  group_by: [BUCKET_ALIAS],
  sort: [{ field: BUCKET_ALIAS, dir: QuerySortDirection.Asc }],
  page: { type: 'offset', offset: 0, limit: BUCKET_ROW_LIMIT, include_total: false } as StructuredQuery['page'],
});

/**
 * One row of totals for the window. Distinct callers cannot be summed out of the bucketed response —
 * a user active in several buckets is one user — so the headline figures come from here.
 */
export const buildTotalsQuery = (scope: QueryScope): StructuredQuery => ({
  entity: USAGE_ENTITY,
  mode: QueryMode.Aggregate,
  filter: buildFilter(scope),
  select: commonMeasures(scope.view),
});

/**
 * The active breakdown tab, ranked and limited by the backend.
 *
 * `searchTerm` is a filter on the aggregate, not a sieve over what arrived: the backend re-ranks the
 * whole window and returns the matching head of it, so a term reaches rows this page never loaded.
 */
export const buildTabQuery = (
  scope: QueryScope,
  tab: BreakdownTab,
  limit: number,
  searchTerm?: string,
): StructuredQuery => {
  const column = BREAKDOWN_TAB_COLUMN[tab];
  const extra: QueryFilterNode[] = searchTerm
    ? [{ op: QueryOperator.Ico, args: [field(column), value(searchTerm)] }]
    : [];

  return {
    entity: USAGE_ENTITY,
    mode: QueryMode.Aggregate,
    filter: buildFilter(scope, extra),
    select: [{ expr: field(column) }, ...commonMeasures(scope.view)],
    group_by: [column],
    sort: [
      { field: CALLS_ALIAS, dir: QuerySortDirection.Desc },
      { field: column, dir: QuerySortDirection.Asc },
    ],
    page: { type: 'offset', offset: 0, limit, include_total: false } as StructuredQuery['page'],
  };
};

/**
 * Spend alone, truncated to a calendar unit — the spend view reads days or months, so it needs no
 * other measure and no epoch-aligned bin: `date_trunc` is what puts a month on its own first day.
 */
export const buildSpendBucketedQuery = (scope: QueryScope, unit: SpendScaleUnit): StructuredQuery => ({
  entity: USAGE_ENTITY,
  mode: QueryMode.Aggregate,
  filter: buildFilter(scope),
  select: [
    {
      expr: fn('date_trunc', [value(unit), field('request_time')]),
      as: BUCKET_ALIAS,
    },
    { expr: fn('sum', [field('deployment_price')]), as: SPEND_ALIAS },
  ],
  group_by: [BUCKET_ALIAS],
  sort: [{ field: BUCKET_ALIAS, dir: QuerySortDirection.Asc }],
  page: { type: 'offset', offset: 0, limit: BUCKET_ROW_LIMIT, include_total: false } as StructuredQuery['page'],
});

/**
 * Calls per bucket, split by one dimension. The series are bounded by `ids` — the ranking the share
 * chart already resolved — rather than by a page limit: a limit over bucket × dimension rows would
 * cut series mid-window and leave a stack that climbs and drops for no reason.
 */
export const buildDimensionBucketedQuery = (
  scope: QueryScope,
  resolution: ChartResolution,
  tab: BreakdownTab,
  ids: string[],
): StructuredQuery => {
  const column = BREAKDOWN_TAB_COLUMN[tab];

  return {
    entity: USAGE_ENTITY,
    mode: QueryMode.Aggregate,
    filter: buildFilter(scope, [
      {
        op: QueryOperator.In,
        args: [
          field(column),
          {
            type: QueryExprType.Array,
            items: ids.map(
              (id) => ({ type: QueryExprType.Value, value_type: QueryValueType.String, value: id }) as const,
            ),
          },
        ],
      },
    ]),
    select: [
      {
        expr: fn('date_bin', [
          value(String(resolution.value), QueryValueType.Integer),
          value(BUCKET_UNIT[resolution.unit]),
          field('request_time'),
        ]),
        as: BUCKET_ALIAS,
      },
      { expr: field(column) },
      { expr: fn('count', []), as: CALLS_ALIAS },
    ],
    group_by: [BUCKET_ALIAS, column],
    sort: [{ field: BUCKET_ALIAS, dir: QuerySortDirection.Asc }],
    page: { type: 'offset', offset: 0, limit: BUCKET_ROW_LIMIT, include_total: false } as StructuredQuery['page'],
  };
};
